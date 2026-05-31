import { NextResponse } from 'next/server';

const store = global._mf_agents ?? (global._mf_agents = new Map());

function genId() { return `ag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export async function GET(request, { params }) {
    const { path = [] } = await params;
    const { search } = new URL(request.url);
    const [id, action] = path;

    if (!id || new URLSearchParams(search).get('is_template') === 'true') {
        return NextResponse.json([]);
    }

    const agent = store.get(id) || { id, agent_id: id, name: 'Agent' };

    if (action === 'conversations' || action === 'conversation') {
        return NextResponse.json([]);
    }

    return NextResponse.json(agent);
}

export async function POST(request, { params }) {
    const { path = [] } = await params;
    const [action] = path;

    let body = {};
    try { body = await request.json(); } catch {}

    if (action === 'create' || !action) {
        const id = genId();
        const agent = { id, agent_id: id, name: body.name || 'Новый агент', ...body, created_at: new Date().toISOString() };
        store.set(id, agent);
        return NextResponse.json(agent);
    }

    const id = action;
    const existing = store.get(id) || { id, agent_id: id };
    const updated = { ...existing, ...body, id, agent_id: id };
    store.set(id, updated);
    return NextResponse.json(updated);
}

export async function PUT(request, { params }) {
    return POST(request, { params });
}

export async function DELETE(request, { params }) {
    const { path = [] } = await params;
    store.delete(path[0]);
    return NextResponse.json({ success: true });
}
