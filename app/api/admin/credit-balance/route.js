import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];

export async function POST(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    }

    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const publicSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: u, error: uErr } = await publicSb.auth.getUser(token);
    if (uErr || !u?.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const adminEmail = (u.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.some(e => e.toLowerCase() === adminEmail)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { userId, amount } = body;
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt === 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 });

    try {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

        const { data: authUser, error: aErr } = await admin.auth.admin.getUserById(userId);
        if (aErr || !authUser?.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const email = authUser.user.email || '';
        const fullName = authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || null;

        const { data: existing } = await admin.from('profiles').select('balance').eq('id', userId).single();
        const newBalance = Math.max(0, Number(existing?.balance || 0) + amt);

        const { error: upErr } = await admin.from('profiles').upsert({ id: userId, email, full_name: fullName, balance: newBalance });
        if (upErr) throw new Error('upsert failed: ' + upErr.message);

        await admin.from('balance_transactions').insert({
            user_id: userId,
            amount: amt,
            reason: 'admin_topup',
            meta: { admin: adminEmail },
        });

        return NextResponse.json({ ok: true, balance: newBalance });
    } catch (err) {
        console.error('credit-balance error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
