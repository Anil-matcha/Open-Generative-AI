from fastapi import APIRouter, HTTPException, Request
from app.utils.workflow_helper import (
    create_or_update_workflow, 
    get_node_schemas_helper, 
    get_api_node_schemas_helper,
    get_workflow_def_helper,
    run_workflow_helper,
    get_run_status_helper,
    run_node_helper,
    publish_workflow_helper,
    template_workflow_helper,
    cloudfront_signed_url_helper,
    generate_thumbnail_helper,
    get_workflow_defs_helper,
    delete_workflow_def_by_id,
    update_workflow_name_helper,
    get_workflow_last_run,
    architect_workflow_helper,
    poll_architect_result_helper,
    delete_node_run_by_id_helper,
    update_workflow_category_helper,
    get_workflow_api_inputs_helper,
    execute_workflow_via_api_helper,
    get_workflow_api_outputs_helper
)

router = APIRouter()

@router.post("/create")
async def create_workflow(request: Request):
    try:
        payload = await request.json()
        return await create_or_update_workflow(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/get-workflow-defs")
async def get_workflow_defs():
    try:
        return await get_workflow_defs_helper()
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/get-workflow-def/{workflow_id}")
async def get_workflow_def(workflow_id: str):
    try:
        return await get_workflow_def_helper(workflow_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{workflow_id}/node-schemas")
async def get_node_schemas(workflow_id: str):
    try:
        return await get_node_schemas_helper(workflow_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/delete-workflow-def/{workflow_id}")
async def delete_workflow_def(workflow_id: str):
    try:
        return await delete_workflow_def_by_id(workflow_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/update-name/{workflow_id}")
async def update_workflow_name(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await update_workflow_name_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{workflow_id}/api-node-schemas")
async def get_api_node_schemas(workflow_id: str):
    try:
        return await get_api_node_schemas_helper(workflow_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{workflow_id}/run")
async def run_workflow(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await run_workflow_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/run/{run_id}/status")
async def get_run_status(run_id: str):
    try:
        return await get_run_status_helper(run_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{workflow_id}/node/{node_id}/run")
async def run_node(workflow_id: str, node_id: str, request: Request):
    try:
        payload = await request.json()
        return await run_node_helper(workflow_id, node_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workflow/{workflow_id}/publish")
async def publish_workflow(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await publish_workflow_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/workflow/{workflow_id}/template")
async def template_workflow(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await template_workflow_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cloudfront-signed-url")
async def cloudfront_signed_url(request: Request):
    try:
        payload = await request.json()
        return await cloudfront_signed_url_helper(payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{workflow_id}/thumbnail")
async def generate_thumbnail(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await generate_thumbnail_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/get-workflow-last-run/{workflow_id}")
async def get_workflow_last_run_endpoint(
    workflow_id: str,
):
    try:
        return await get_workflow_last_run(workflow_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/architect")
async def architect_workflow_endpoint(
    request: Request,
):
    try:
        payload = await request.json()
        return await architect_workflow_helper(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/poll-architect/{id}/result")
async def poll_architect_result(id: str):
    try:
        return await poll_architect_result_helper(id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/node-run/{node_run_id}")
async def delete_node_run(node_run_id: str):
    try:
        return await delete_node_run_by_id_helper(node_run_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/update-category/{workflow_id}")
async def update_workflow_category(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await update_workflow_category_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{workflow_id}/api-inputs")
async def get_workflow_api_inputs(workflow_id: str):
    try:
        return await get_workflow_api_inputs_helper(workflow_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{workflow_id}/api-execute")
async def execute_workflow_via_api(workflow_id: str, request: Request):
    try:
        payload = await request.json()
        return await execute_workflow_via_api_helper(workflow_id, payload)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/run/{run_id}/api-outputs")
async def get_workflow_api_outputs(run_id: str):
    try:
        return await get_workflow_api_outputs_helper(run_id)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))