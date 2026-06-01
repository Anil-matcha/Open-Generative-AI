// Payment backend ported from creator-club (Точка Bank acquiring + Supabase).
//   POST /api/payments/create        — create a top-up payment, returns paymentUrl
//   POST /api/payments/verify        — verify one order, credit balance (atomic)
//   GET  /api/payments/poll-pending  — cron: sweep pending payments, credit paid
//
// Env vars (add to Vercel — same values as creator-club):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   TOCHKA_TOKEN, TOCHKA_CUSTOMER_CODE, PUBLIC_BASE_URL, CRON_SECRET
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TOCHKA_BASE_URL = 'https://enter.tochka.com/uapi';
const TOCHKA_CUSTOMER_CODE = process.env.TOCHKA_CUSTOMER_CODE || '305723470';
const TOCHKA_TOKEN = process.env.TOCHKA_TOKEN?.trim();
const CRON_SECRET = process.env.CRON_SECRET;

function anon() { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }); }
function admin() { return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }); }

async function getUser(request) {
    const auth = request.headers.get('authorization') || '';
    const jwt = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!jwt) return null;
    const { data, error } = await anon().auth.getUser(jwt);
    if (error || !data?.user) return null;
    return data.user;
}

async function createPayment(request) {
    if (!TOCHKA_TOKEN) return NextResponse.json({ error: 'TOCHKA_TOKEN missing' }, { status: 500 });
    if (!SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });

    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const amountNum = Number(body.amount);
    if (!Number.isFinite(amountNum) || amountNum < 100 || amountNum > 100000) {
        return NextResponse.json({ error: 'Сумма должна быть от 100 до 100000 руб' }, { status: 400 });
    }

    const db = admin();
    try {
        // 1. merchantId
        const retailersResp = await fetch(
            `${TOCHKA_BASE_URL}/acquiring/v1.0/retailers?customerCode=${TOCHKA_CUSTOMER_CODE}`,
            { headers: { 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE } }
        );
        const retailersData = await retailersResp.json();
        const list = retailersData.Data?.Retailer || retailersData.Data?.retailers || [];
        const arr = Array.isArray(list) ? list : [list];
        const retailer = arr.find(r => r?.isActive === true || r?.isActive === 'true') || arr[0];
        const merchantId = retailer?.merchantId;
        if (!merchantId) return NextResponse.json({ error: 'merchantId not found', raw: retailersData }, { status: 502 });

        // 2. DB record
        const orderId = `cc-${user.id.slice(0, 8)}-${Date.now()}`;
        const { error: insErr } = await db.from('payments').insert({
            id: orderId, user_id: user.id, amount: amountNum, status: 'pending',
        });
        if (insErr) return NextResponse.json({ error: 'DB insert error', message: insErr.message }, { status: 500 });

        // 3. Tochka payment
        const origin = process.env.PUBLIC_BASE_URL || new URL(request.url).origin;
        const response = await fetch(`${TOCHKA_BASE_URL}/acquiring/v1.0/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE },
            body: JSON.stringify({
                Data: {
                    customerCode: TOCHKA_CUSTOMER_CODE, amount: amountNum,
                    purpose: `Пополнение баланса, ${user.email || user.id}`,
                    merchantId, paymentMode: ['card', 'sbp'],
                    redirectUrl: `${origin}/?payment=success&order=${encodeURIComponent(orderId)}`,
                    failRedirectUrl: `${origin}/?payment=fail&order=${encodeURIComponent(orderId)}`,
                    paymentLinkId: orderId,
                }
            }),
        });
        const data = JSON.parse(await response.text());
        if (!data.Data?.paymentLink) {
            await db.from('payments').update({ status: 'failed' }).eq('id', orderId);
            return NextResponse.json({ error: 'Tochka API error', detail: data }, { status: 502 });
        }
        if (data.Data?.operationId) {
            await db.from('payments').update({ operation_id: data.Data.operationId }).eq('id', orderId);
        }
        return NextResponse.json({ paymentUrl: data.Data.paymentLink, orderId });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function verifyPayment(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId;
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const db = admin();
    try {
        const { data: payment, error: selErr } = await db.from('payments').select('*').eq('id', orderId).single();
        if (selErr || !payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        if (payment.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (payment.status === 'paid') return NextResponse.json({ status: 'paid', credited: false });
        if (!payment.operation_id) return NextResponse.json({ error: 'operation_id missing' }, { status: 500 });

        const tochkaResp = await fetch(
            `${TOCHKA_BASE_URL}/acquiring/v1.0/payments/${encodeURIComponent(payment.operation_id)}`,
            { headers: { 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE } }
        );
        const tochkaData = await tochkaResp.json();
        const op = tochkaData?.Data?.Operation?.[0] || tochkaData?.Data;
        const status = (op?.status || '').toUpperCase();

        if (status === 'APPROVED' || status === 'PAID' || status === 'CONFIRMED') {
            // Atomic claim: pending → paid only if still pending (no double credit)
            const { data: claimed, error: claimErr } = await db
                .from('payments')
                .update({ status: 'paid', paid_at: new Date().toISOString() })
                .eq('id', orderId).neq('status', 'paid').select();
            if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });
            if (!claimed || claimed.length === 0) return NextResponse.json({ status: 'paid', credited: false });

            const { data: profile } = await db.from('profiles').select('balance').eq('id', user.id).single();
            const newBalance = Number(profile?.balance || 0) + Number(payment.amount);
            await db.from('profiles').update({ balance: newBalance }).eq('id', user.id);
            return NextResponse.json({ status: 'paid', credited: true, balance: newBalance });
        }
        return NextResponse.json({ status: 'pending', tochkaStatus: status });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

async function pollPending(request) {
    const auth = request.headers.get('authorization') || '';
    if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!TOCHKA_TOKEN || !SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'config missing' }, { status: 500 });
    }
    const db = admin();
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const { data: pending, error: selErr } = await db
        .from('payments').select('id, user_id, amount, operation_id')
        .eq('status', 'pending').not('operation_id', 'is', null)
        .lt('created_at', oneMinAgo).gt('created_at', sevenDaysAgo).limit(100);
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    if (!pending?.length) return NextResponse.json({ checked: 0, credited: 0 });

    let credited = 0;
    for (const p of pending) {
        try {
            const resp = await fetch(
                `${TOCHKA_BASE_URL}/acquiring/v1.0/payments/${encodeURIComponent(p.operation_id)}`,
                { headers: { 'Authorization': `Bearer ${TOCHKA_TOKEN}`, 'CustomerCode': TOCHKA_CUSTOMER_CODE } }
            );
            const data = await resp.json();
            const op = data?.Data?.Operation?.[0] || data?.Data;
            const status = (op?.status || '').toUpperCase();
            if (status === 'APPROVED' || status === 'PAID' || status === 'CONFIRMED') {
                const { data: claimed } = await db.from('payments')
                    .update({ status: 'paid', paid_at: new Date().toISOString() })
                    .eq('id', p.id).neq('status', 'paid').select();
                if (claimed && claimed.length) {
                    const { data: profile } = await db.from('profiles').select('balance').eq('id', p.user_id).single();
                    const newBalance = Number(profile?.balance || 0) + Number(p.amount);
                    await db.from('profiles').update({ balance: newBalance }).eq('id', p.user_id);
                    credited++;
                }
            } else if (['REJECTED', 'CANCELLED', 'EXPIRED', 'FAILED'].includes(status)) {
                await db.from('payments').update({ status: 'failed' }).eq('id', p.id);
            }
        } catch { /* skip */ }
    }
    return NextResponse.json({ checked: pending.length, credited });
}

export async function POST(request, { params }) {
    const { action = [] } = await params;
    const a = action[0];
    if (a === 'create') return createPayment(request);
    if (a === 'verify') return verifyPayment(request);
    if (a === 'poll-pending') return pollPending(request);
    return NextResponse.json({ error: 'Unknown action' }, { status: 404 });
}

export async function GET(request, { params }) {
    const { action = [] } = await params;
    if (action[0] === 'poll-pending') return pollPending(request);
    return NextResponse.json({ error: 'Unknown action' }, { status: 404 });
}
