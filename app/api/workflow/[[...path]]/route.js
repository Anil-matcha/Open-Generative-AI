import { NextResponse } from 'next/server';

const store = global._mf_workflows ?? (global._mf_workflows = new Map());

function genId() { return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function emptyWorkflow(id) {
    return { workflow_id: id, id, name: 'Untitled', nodes: [], edges: [], created_at: new Date().toISOString() };
}

export async function GET(request, { params }) {
    const { path = [] } = await params;
    const { search } = new URL(request.url);

    // GET /api/workflow/get-workflow-def/{id}
    if (path[0] === 'get-workflow-def') {
        const id = path[1];
        const wf = store.get(id) || {};
        return NextResponse.json({
            workflow_id: id, id, name: wf.name || 'Untitled Workflow',
            data: { nodes: wf.nodes || [] },
            edges: wf.edges || [],
            is_owner: true, is_published: false, is_template: false,
            show_temp_button: false, run_id: null, category: 'General',
        });
    }

    // GET /api/workflow/{id}/node-schemas
    if (path[1] === 'node-schemas') {
        return NextResponse.json({ categories: {} });
    }

    // GET /api/workflow/run/{runId}/status
    if (path[0] === 'run' && path[2] === 'status') {
        return NextResponse.json({ status: 'completed', result: {} });
    }

    // GET /api/workflow/{id}
    const id = path[0];
    if (!id) return NextResponse.json([]);
    const wf = store.get(id) || emptyWorkflow(id);
    return NextResponse.json(wf);
}

export async function POST(request, { params }) {
    const { path = [] } = await params;

    let body = {};
    try { body = await request.json(); } catch {}

    // POST /api/workflow/create
    if (path[0] === 'create' || path.length === 0) {
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

    // POST /api/workflow/{id}/run
    if (path[1] === 'run') {
        const runId = genId();
        return NextResponse.json({ run_id: runId, status: 'completed', result: {} });
    }

    // POST /api/workflow/{id}/publish or /template or /update-category etc.
    if (['publish', 'template', 'update-category'].includes(path[1])) {
        return NextResponse.json({ success: true });
    }

    // POST /api/workflow/architect
    if (path[0] === 'architect') {
        const reqId = genId();
        return NextResponse.json({ request_id: reqId, status: 'completed', result: {} });
    }

    // POST /api/workflow/poll-architect/{id}/result
    if (path[0] === 'poll-architect') {
        return NextResponse.json({ status: 'completed', result: {} });
    }

    // Generic save/update
    const id = path[0];
    const existing = store.get(id) || emptyWorkflow(id);
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
