import { NextResponse } from 'next/server';

// In-memory workflow store per serverless instance
// Workflows persisted client-side via localStorage; this handles builder API calls
const store = global._mf_workflows ?? (global._mf_workflows = new Map());

function genId() { return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function getApiKey(request) {
    return request.headers.get('Authorization')?.replace('Bearer ', '') ||
           request.headers.get('x-api-key') ||
           request.cookies.get('muapi_key')?.value || '';
}

export async function GET(request, { params }) {
    const { path = [] } = await params;
    const [id, action] = path;

    if (!id) return NextResponse.json([]);

    const wf = store.get(id) || { workflow_id: id, id, name: 'Workflow', nodes: [], edges: [] };

    if (action === 'get-workflow-def' || action === 'builder' || action === 'playground') {
        return NextResponse.json({ ...wf, nodes: wf.nodes || [], edges: wf.edges || [] });
    }

    if (action === 'inputs' || action === 'input-schema') {
        return NextResponse.json({ properties: {}, required: [] });
    }

    return NextResponse.json(wf);
}

export async function POST(request, { params }) {
    const { path = [] } = await params;
    const [action] = path;

    let body = {};
    try { body = await request.json(); } catch {}

    if (action === 'create' || !action) {
        const id = body.workflow_id || genId();
        const wf = {
            workflow_id: id, id,
            name: body.name || 'Untitled Workflow',
            nodes: body.data?.nodes || [],
            edges: body.edges || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        store.set(id, wf);
        return NextResponse.json(wf);
    }

    // Save/update workflow (path[0] is the id)
    const id = action;
    const existing = store.get(id) || { workflow_id: id, id };
    const updated = { ...existing, ...body, workflow_id: id, id, updated_at: new Date().toISOString() };
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
