"""
CutAI Pydantic Schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    genre: Optional[str] = None
    premise: Optional[str] = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    genre: Optional[str]
    premise: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScriptGenerate(BaseModel):
    project_id: int
    genre: str
    premise: str


class ScriptUpdate(BaseModel):
    raw_script: str


class ScriptResponse(BaseModel):
    id: int
    project_id: int
    raw_script: Optional[str]
    generated_at: datetime

    class Config:
        from_attributes = True


class SceneCreate(BaseModel):
    project_id: int
    scene_number: int
    title: Optional[str] = None
    description: str
    time_of_day: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[float] = 3.0


class ShotCreate(BaseModel):
    scene_id: int
    shot_number: int
    shot_type: Optional[str] = None
    camera_angle: Optional[str] = None
    camera_movement: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[float] = 3.0
    sd_prompt: Optional[str] = None


class ShotUpdate(BaseModel):
    title: Optional[str] = None
    shot_type: Optional[str] = None
    camera_angle: Optional[str] = None
    camera_movement: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[float] = None
    sd_prompt: Optional[str] = None
    order_index: Optional[int] = None


class ShotResponse(BaseModel):
    id: int
    scene_id: int
    shot_number: int
    shot_type: Optional[str]
    camera_angle: Optional[str]
    camera_movement: Optional[str]
    description: Optional[str]
    duration: float
    sd_prompt: Optional[str]
    order_index: int

    class Config:
        from_attributes = True


class SceneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    time_of_day: Optional[str] = None
    location: Optional[str] = None
    duration: Optional[float] = None
    mood_tension: Optional[float] = None
    mood_emotion: Optional[float] = None
    mood_energy: Optional[float] = None
    mood_darkness: Optional[float] = None
    soundtrack_genre: Optional[str] = None
    soundtrack_tempo: Optional[str] = None
    soundtrack_instruments: Optional[List[str]] = None
    soundtrack_reference: Optional[str] = None
    order_index: Optional[int] = None


class SceneResponse(BaseModel):
    id: int
    project_id: int
    scene_number: int
    title: Optional[str]
    description: str
    time_of_day: Optional[str]
    location: Optional[str]
    duration: float
    mood_tension: float
    mood_emotion: float
    mood_energy: float
    mood_darkness: float
    soundtrack_genre: Optional[str]
    soundtrack_tempo: Optional[str]
    soundtrack_instruments: Optional[List[str]]
    soundtrack_reference: Optional[str]
    order_index: int
    shots: List[ShotResponse] = []

    class Config:
        from_attributes = True


class StoryboardGenerate(BaseModel):
    project_id: int
    genre: str
    premise: str


class StoryboardResponse(BaseModel):
    project: ProjectResponse
    scenes: List[SceneResponse]
    script: Optional[ScriptResponse]


class ExportRequest(BaseModel):
    project_id: int
    format: str = "json"


class StoryboardProjectCreate(BaseModel):
    characters: List[dict]
    scenes: List[dict]
    shots: List[dict]


class CharacterData(BaseModel):
    name: str
    traits: str
    image_url: Optional[str] = None


class SceneData(BaseModel):
    title: str
    description: str


class ShotData(BaseModel):
    scene_index: int
    prompt: str
    narration: Optional[str] = None
    shot_type: str
