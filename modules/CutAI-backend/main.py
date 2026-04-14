"""
CutAI Backend - AI Storyboarding FastAPI Server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .routers import projects, scripts, scenes, shots, storyboard, export
from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting CutAI Backend on port {settings.PORT}")
    yield
    print("Shutting down CutAI Backend")


app = FastAPI(
    title="CutAI - AI Storyboarder",
    description="AI-powered storyboard generation with script parsing, scene analysis, and mood tracking",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(scenes.router, prefix="/api/scenes", tags=["scenes"])
app.include_router(shots.router, prefix="/api/shots", tags=["shots"])
app.include_router(storyboard.router, prefix="/api/storyboard", tags=["storyboard"])
app.include_router(export.router, prefix="/api/export", tags=["export"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cutai-backend"}


@app.get("/")
async def root():
    return {
        "message": "CutAI - AI Storyboarder API",
        "docs": "/docs",
        "health": "/health"
    }
