from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
# The .env file is located in the server/ directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import workflow_router, app_router

app = FastAPI(title="Workflow API", version="1.0.0")

app.include_router(workflow_router.router, prefix="/api/workflow", tags=["workflow"])
app.include_router(app_router.router, prefix="/api/app", tags=["app"])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Workflow API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
