"""
CutAI Scripts Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.database import get_db, Project, Script
from ..models.schemas import ScriptGenerate, ScriptUpdate, ScriptResponse
from ..services.script_parser import script_parser

router = APIRouter()


@router.post("/generate", response_model=ScriptResponse)
async def generate_script(data: ScriptGenerate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenes_data = await script_parser.generate_script(data.genre, data.premise)
    
    import json
    raw_script = json.dumps(scenes_data, indent=2)
    
    script = Script(
        project_id=data.project_id,
        raw_script=raw_script
    )
    db.add(script)
    
    project.genre = data.genre
    project.premise = data.premise
    db.commit()
    db.refresh(script)
    
    return script


@router.get("/{project_id}", response_model=ScriptResponse)
def get_script(project_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.project_id == project_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


@router.patch("/{project_id}", response_model=ScriptResponse)
def update_script(project_id: int, data: ScriptUpdate, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.project_id == project_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    script.raw_script = data.raw_script
    db.commit()
    db.refresh(script)
    
    return script
