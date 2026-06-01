import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAILS = ['kaban.vershinin@gmail.com', 'didig.vershinin@yandex.ru'];

export async function GET(request) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 });
    }

    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const publicSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: u, error: uErr } = await publicSb.auth.getUser(token);
    if (uErr || !u?.user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const email = (u.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.some(e => e.toLowerCase() === email)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

        const { data: profilesRaw, error: pErr } = await admin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (pErr) throw new Error('Failed to load profiles: ' + pErr.message);
        const profiles = profilesRaw || [];

        const authUsers = [];
        let page = 1;
        while (true) {
            const { data: list, error: lErr } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
            if (lErr) throw new Error('Failed to list auth users: ' + lErr.message);
            const users = list?.users || [];
            authUsers.push(...users);
            if (users.length < 1000) break;
            page++;
        }

        const profileById = new Map(profiles.map(p => [p.id, p]));
        const merged = authUsers.map(au => {
            const existing = profileById.get(au.id);
            if (existing) return existing;
            return {
                id: au.id,
                email: au.email || '',
                full_name: au.user_metadata?.full_name || au.user_metadata?.name || null,
                balance: 0,
                created_at: au.created_at,
                _no_profile: true,
            };
        });
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return NextResponse.json({ profiles: merged, authUsersCount: authUsers.length });
    } catch (err) {
        console.error('admin/users error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
