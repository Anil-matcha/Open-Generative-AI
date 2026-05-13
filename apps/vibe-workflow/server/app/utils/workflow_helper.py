import os
import httpx
import logging
from fastapi import HTTPException
from typing import Optional

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MU_API_KEY = os.getenv("MU_API_KEY")

async def get_api_key():
    api_key = MU_API_KEY
    if not api_key:
        raise HTTPException(status_code=400, detail="Setup MU_API_KEY in .env to be able to use Workflow")
    return api_key

async def proxy_request_helper(method: str, url: str, payload: Optional[dict] = None):
    api_key = await get_api_key()
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
    }

    async with httpx.AsyncClient() as client:
        try:
            if method.upper() == "GET":
                response = await client.get(url, headers=headers, timeout=60.0)
            elif method.upper() == "POST":
                response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=headers, timeout=60.0)
            else:
                raise HTTPException(status_code=405, detail=f"Method {method} not supported in proxy")

        except httpx.RequestError as e:
            logger.error(f"HTTPExt Request Error for {method} {url}: {e}")
            raise HTTPException(status_code=500, detail=f"Error contacting remote server: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error in proxy_request_helper for {method} {url}: {e}")
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

    try:
        if response.content:
            resp_json = response.json()
        else:
            resp_json = {}
    except ValueError:
        resp_json = {"detail": response.text or "Unknown error from remote server"}

    if response.status_code == 200:
        return resp_json
    else:
        error_detail = resp_json.get("detail", "Something went wrong")
        logger.warning(f"Remote server returned {response.status_code}: {error_detail}")
        raise HTTPException(status_code=response.status_code, detail=error_detail)

async def create_or_update_workflow(payload: dict):
    url = "https://api.muapi.ai/workflow/create"
    return await proxy_request_helper("POST", url, payload)

async def get_node_schemas_helper(workflow_id: str):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/node-schemas"
    return await proxy_request_helper("GET", url)

async def get_api_node_schemas_helper(workflow_id: str):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/api-node-schemas"
    return await proxy_request_helper("GET", url)

async def get_workflow_def_helper(workflow_id: str):
    url = f"https://api.muapi.ai/workflow/get-workflow-def/{workflow_id}"
    return await proxy_request_helper("GET", url)

async def get_workflow_defs_helper():
    url = "https://api.muapi.ai/workflow/get-workflow-defs"
    return await proxy_request_helper("GET", url)

async def delete_workflow_def_by_id(workflow_id: str):
    url = f"https://api.muapi.ai/workflow/delete-workflow-def/{workflow_id}"
    return await proxy_request_helper("DELETE", url)

async def update_workflow_name_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/update-name/{workflow_id}"
    return await proxy_request_helper("POST", url, payload)

async def run_workflow_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/run"
    return await proxy_request_helper("POST", url, payload)

async def get_run_status_helper(run_id: str):
    url = f"https://api.muapi.ai/workflow/run/{run_id}/status"
    return await proxy_request_helper("GET", url)

async def run_node_helper(workflow_id: str, node_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/node/{node_id}/run"
    return await proxy_request_helper("POST", url, payload)

async def publish_workflow_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/workflow/{workflow_id}/publish"
    return await proxy_request_helper("POST", url, payload)

async def template_workflow_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/workflow/{workflow_id}/template"
    return await proxy_request_helper("POST", url, payload)

async def cloudfront_signed_url_helper(payload: dict):
    url = "https://api.muapi.ai/workflow/cloudfront-signed-url"
    return await proxy_request_helper("POST", url, payload)

async def generate_thumbnail_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/thumbnail"
    return await proxy_request_helper("POST", url, payload)

async def get_file_upload_url_helper(params: dict):
    import urllib.parse
    query_string = urllib.parse.urlencode(params)
    url = f"https://api.muapi.ai/app/get_file_upload_url?{query_string}"
    return await proxy_request_helper("GET", url)

async def get_workflow_last_run(workflow_id: str):
    url = f"https://api.muapi.ai/workflow/get-workflow-last-run/{workflow_id}"
    return await proxy_request_helper("GET", url)

async def architect_workflow_helper(payload: dict):
    url = "https://api.muapi.ai/workflow/architect"
    return await proxy_request_helper("POST", url, payload)

async def poll_architect_result_helper(id: str):
    url = f"https://api.muapi.ai/workflow/poll-architect/{id}/result"
    return await proxy_request_helper("GET", url)

async def delete_node_run_by_id_helper(node_run_id: str):
    url = f"https://api.muapi.ai/workflow/node-run/{node_run_id}"
    return await proxy_request_helper("DELETE", url)

async def update_workflow_category_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/update-category/{workflow_id}"
    return await proxy_request_helper("POST", url, payload)

async def get_workflow_api_inputs_helper(workflow_id: str):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/api-inputs"
    return await proxy_request_helper("GET", url)

async def execute_workflow_via_api_helper(workflow_id: str, payload: dict):
    url = f"https://api.muapi.ai/workflow/{workflow_id}/api-execute"
    return await proxy_request_helper("POST", url, payload)

async def get_workflow_api_outputs_helper(run_id: str):
    url = f"https://api.muapi.ai/workflow/run/{run_id}/api-outputs"
    return await proxy_request_helper("GET", url)
