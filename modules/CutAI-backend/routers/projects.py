"""
CutAI Projects Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import copy

from ..models.database import get_db, Project, Scene, Shot, Script
from ..models.schemas import ProjectCreate, ProjectResponse

router = APIRouter()


@router.post("/", response_model=ProjectResponse)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    db_project = Project(
        name=project.name,
        genre=project.genre,
        premise=project.premise
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.updated_at.desc()).all()
    return projects


@router.post("/{project_id}/duplicate", response_model=ProjectResponse)
def duplicate_project(project_id: int, db: Session = Depends(get_db)):
    original = db.query(Project).filter(Project.id == project_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_project = Project(
        name=f"{original.name} (Copy)",
        genre=original.genre,
        premise=original.premise
    )
    db.add(new_project)
    db.flush()
    
    scenes = db.query(Scene).filter(Scene.project_id == original.id).order_by(Scene.order_index).all()
    for scene in scenes:
        new_scene = Scene(
            project_id=new_project.id,
            scene_number=scene.scene_number,
            title=scene.title,
            description=scene.description,
            time_of_day=scene.time_of_day,
            location=scene.location,
            duration=scene.duration,
            mood_tension=scene.mood_tension,
            mood_emotion=scene.mood_emotion,
            mood_energy=scene.mood_energy,
            mood_darkness=scene.mood_darkness,
            soundtrack_genre=scene.soundtrack_genre,
            soundtrack_tempo=scene.soundtrack_tempo,
            soundtrack_instruments=scene.soundtrack_instruments,
            soundtrack_reference=scene.soundtrack_reference,
            order_index=scene.order_index
        )
        db.add(new_scene)
        db.flush()
        
        shots = db.query(Shot).filter(Shot.scene_id == scene.id).order_by(Shot.order_index).all()
        for shot in shots:
            new_shot = Shot(
                scene_id=new_scene.id,
                shot_number=shot.shot_number,
                shot_type=shot.shot_type,
                camera_angle=shot.camera_angle,
                camera_movement=shot.camera_movement,
                description=shot.description,
                duration=shot.duration,
                sd_prompt=shot.sd_prompt,
                order_index=shot.order_index
            )
            db.add(new_shot)
    
    original_script = db.query(Script).filter(Script.project_id == original.id).first()
    if original_script:
        new_script = Script(
            project_id=new_project.id,
            raw_script=original_script.raw_script
        )
        db.add(new_script)
    
    db.commit()
    db.refresh(new_project)
    return new_project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}
