from fastapi import APIRouter, HTTPException, Request
from app.utils.workflow_helper import get_file_upload_url_helper

router = APIRouter()

@router.get("/get_file_upload_url")
async def get_file_upload_url(request: Request):
    try:
        # FastAPI's request.query_params returns an immutable dict-like object
        params = dict(request.query_params)
        return await get_file_upload_url_helper(params)
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=400, detail=str(e))
