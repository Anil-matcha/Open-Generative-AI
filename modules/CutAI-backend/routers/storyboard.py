"""
CutAI Storyboard Router - Main generation endpoint
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import uuid

from ..models.database import get_db, Project, Scene, Shot, Script
from ..models.schemas import StoryboardGenerate, StoryboardResponse, ProjectResponse, SceneResponse, ScriptResponse, StoryboardProjectCreate, CharacterData, SceneData, ShotData
from ..services.script_parser import script_parser
from ..services.scene_analyzer import scene_analyzer

router = APIRouter()


@router.post("/generate", response_model=StoryboardResponse)
async def generate_storyboard(data: StoryboardGenerate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        project = Project(
            name=f"Project {data.project_id}",
            genre=data.genre,
            premise=data.premise
        )
        db.add(project)
        db.commit()
        db.refresh(project)
    
    scenes_data = await script_parser.generate_script(data.genre, data.premise)
    
    analyzed_scenes = await scene_analyzer.analyze_all_scenes(scenes_data)
    
    scene_ids = [s.id for s in db.query(Scene.id).filter(Scene.project_id == project.id).all()]
    if scene_ids:
        db.query(Shot).filter(Shot.scene_id.in_(scene_ids)).delete(synchronize_session=False)
    db.query(Scene).filter(Scene.project_id == project.id).delete()
    
    raw_script = json.dumps(scenes_data, indent=2)
    script = db.query(Script).filter(Script.project_id == project.id).first()
    if script:
        script.raw_script = raw_script
    else:
        script = Script(project_id=project.id, raw_script=raw_script)
        db.add(script)
    
    db_scenes = []
    for i, scene_data in enumerate(analyzed_scenes):
        db_scene = Scene(
            project_id=project.id,
            scene_number=scene_data.get("scene_number", i + 1),
            title=scene_data.get("title"),
            description=scene_data.get("description", ""),
            time_of_day=scene_data.get("time_of_day"),
            location=scene_data.get("location"),
            duration=scene_data.get("duration", 3.0),
            mood_tension=scene_data.get("mood_tension", 0.5),
            mood_emotion=scene_data.get("mood_emotion", 0.5),
            mood_energy=scene_data.get("mood_energy", 0.5),
            mood_darkness=scene_data.get("mood_darkness", 0.5),
            soundtrack_genre=scene_data.get("soundtrack_genre"),
            soundtrack_tempo=scene_data.get("soundtrack_tempo"),
            soundtrack_instruments=scene_data.get("soundtrack_instruments"),
            soundtrack_reference=scene_data.get("soundtrack_reference"),
            order_index=i
        )
        db.add(db_scene)
        db.flush()
        
        shots_data = scene_data.get("shots", [])
        for j, shot_data in enumerate(shots_data):
            db_shot = Shot(
                scene_id=db_scene.id,
                shot_number=shot_data.get("shot_number", j + 1),
                shot_type=shot_data.get("shot_type"),
                camera_angle=shot_data.get("camera_angle"),
                camera_movement=shot_data.get("camera_movement"),
                description=shot_data.get("description"),
                duration=shot_data.get("duration", 3.0),
                sd_prompt=shot_data.get("sd_prompt"),
                order_index=j
            )
            db.add(db_shot)
        
        db_scenes.append(db_scene)
    
    project.genre = data.genre
    project.premise = data.premise
    
    db.commit()
    db.refresh(project)
    
    for scene in db_scenes:
        db.refresh(scene)
    
    for scene in db_scenes:
        db.refresh(scene, attribute_names=['shots'])
    
    return StoryboardResponse(
        project=ProjectResponse.model_validate(project),
        scenes=[SceneResponse.model_validate(s) for s in db_scenes],
        script=ScriptResponse.model_validate(script) if script else None
    )


@router.post("/projects", response_model=StoryboardResponse)
async def create_storyboard_project(data: StoryboardProjectCreate, db: Session = Depends(get_db)):
    """Create a storyboard project from characters, scenes, and shots data"""
    try:
        # Create project
        project = Project(
            name=f"Storyboard Project {uuid.uuid4().hex[:8]}",
            genre="Custom",
            premise="User-created storyboard"
        )
        db.add(project)
        db.flush()

        # Create script from characters data
        characters_data = []
        for char in data.characters:
            characters_data.append({
                "name": char.get("name", ""),
                "traits": char.get("traits", ""),
                "image_url": char.get("image_url")
            })

        script_content = {
            "characters": characters_data,
            "scenes": data.scenes,
            "shots": data.shots
        }

        script = Script(
            project_id=project.id,
            raw_script=json.dumps(script_content, indent=2)
        )
        db.add(script)

        # Create scenes and shots
        db_scenes = []
        for scene_idx, scene_data in enumerate(data.scenes):
            db_scene = Scene(
                project_id=project.id,
                scene_number=scene_idx + 1,
                title=scene_data.get("title", f"Scene {scene_idx + 1}"),
                description=scene_data.get("description", ""),
                time_of_day="Day",
                location="Unknown",
                duration=3.0,
                mood_tension=0.5,
                mood_emotion=0.5,
                mood_energy=0.5,
                mood_darkness=0.5,
                order_index=scene_idx
            )
            db.add(db_scene)
            db.flush()

            # Find shots for this scene
            scene_shots = [shot for shot in data.shots if shot.get("scene_index") == scene_idx]
            for shot_idx, shot_data in enumerate(scene_shots):
                db_shot = Shot(
                    scene_id=db_scene.id,
                    shot_number=shot_idx + 1,
                    shot_type=shot_data.get("shot_type", "Wide Shot"),
                    camera_angle="Eye Level",
                    camera_movement="Static",
                    description=shot_data.get("prompt", ""),
                    duration=3.0,
                    sd_prompt=shot_data.get("prompt", ""),
                    order_index=shot_idx
                )
                db.add(db_shot)

            db_scenes.append(db_scene)

        db.commit()
        db.refresh(project)

        for scene in db_scenes:
            db.refresh(scene)

        return StoryboardResponse(
            project=ProjectResponse.model_validate(project),
            scenes=[SceneResponse.model_validate(s) for s in db_scenes],
            script=ScriptResponse.model_validate(script)
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create storyboard project: {str(e)}")


@router.get("/{project_id}", response_model=StoryboardResponse)
def get_storyboard(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scenes = db.query(Scene).filter(Scene.project_id == project_id).order_by(Scene.order_index).all()
    script = db.query(Script).filter(Script.project_id == project_id).first()

    return StoryboardResponse(
        project=ProjectResponse.model_validate(project),
        scenes=[SceneResponse.model_validate(s) for s in scenes],
        script=ScriptResponse.model_validate(script) if script else None
    )
