"""
CutAI Scenes Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..models.database import get_db, Project, Scene
from ..models.schemas import SceneCreate, SceneUpdate, SceneResponse

router = APIRouter()


@router.post("/", response_model=SceneResponse)
def create_scene(scene: SceneCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == scene.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_scene = Scene(
        project_id=scene.project_id,
        scene_number=scene.scene_number,
        title=scene.title,
        description=scene.description,
        time_of_day=scene.time_of_day,
        location=scene.location,
        duration=scene.duration,
        order_index=scene.scene_number
    )
    db.add(db_scene)
    db.commit()
    db.refresh(db_scene)
    
    return db_scene


@router.get("/{project_id}", response_model=List[SceneResponse])
def list_scenes(project_id: int, db: Session = Depends(get_db)):
    scenes = db.query(Scene).filter(Scene.project_id == project_id).order_by(Scene.order_index).all()
    return scenes


@router.patch("/{scene_id}", response_model=SceneResponse)
def update_scene(scene_id: int, data: SceneUpdate, db: Session = Depends(get_db)):
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(scene, key, value)
    
    db.commit()
    db.refresh(scene)
    
    return scene


@router.delete("/{scene_id}")
def delete_scene(scene_id: int, db: Session = Depends(get_db)):
    scene = db.query(Scene).filter(Scene.id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    db.delete(scene)
    db.commit()
    
    return {"message": "Scene deleted"}
