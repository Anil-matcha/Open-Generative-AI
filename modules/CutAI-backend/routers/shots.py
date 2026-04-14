"""
CutAI Shots Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..models.database import get_db, Scene, Shot
from ..models.schemas import ShotCreate, ShotUpdate, ShotResponse

router = APIRouter()


@router.post("/", response_model=ShotResponse)
def create_shot(shot: ShotCreate, db: Session = Depends(get_db)):
    scene = db.query(Scene).filter(Scene.id == shot.scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    db_shot = Shot(
        scene_id=shot.scene_id,
        shot_number=shot.shot_number,
        shot_type=shot.shot_type,
        camera_angle=shot.camera_angle,
        camera_movement=shot.camera_movement,
        description=shot.description,
        duration=shot.duration,
        sd_prompt=shot.sd_prompt,
        order_index=shot.shot_number
    )
    db.add(db_shot)
    db.commit()
    db.refresh(db_shot)
    
    return db_shot


@router.get("/scene/{scene_id}", response_model=List[ShotResponse])
def list_shots(scene_id: int, db: Session = Depends(get_db)):
    shots = db.query(Shot).filter(Shot.scene_id == scene_id).order_by(Shot.order_index).all()
    return shots


@router.patch("/{shot_id}", response_model=ShotResponse)
def update_shot(shot_id: int, data: ShotUpdate, db: Session = Depends(get_db)):
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(shot, key, value)
    
    db.commit()
    db.refresh(shot)
    
    return shot


@router.delete("/{shot_id}")
def delete_shot(shot_id: int, db: Session = Depends(get_db)):
    shot = db.query(Shot).filter(Shot.id == shot_id).first()
    if not shot:
        raise HTTPException(status_code=404, detail="Shot not found")
    
    db.delete(shot)
    db.commit()
    
    return {"message": "Shot deleted"}


@router.post("/bulk/", response_model=List[ShotResponse])
def create_shots_bulk(shots_data: List[ShotCreate], db: Session = Depends(get_db)):
    created_shots = []
    for shot in shots_data:
        db_shot = Shot(
            scene_id=shot.scene_id,
            shot_number=shot.shot_number,
            shot_type=shot.shot_type,
            camera_angle=shot.camera_angle,
            camera_movement=shot.camera_movement,
            description=shot.description,
            duration=shot.duration,
            sd_prompt=shot.sd_prompt,
            order_index=shot.shot_number
        )
        db.add(db_shot)
        created_shots.append(db_shot)
    
    db.commit()
    for shot in created_shots:
        db.refresh(shot)
    
    return created_shots
