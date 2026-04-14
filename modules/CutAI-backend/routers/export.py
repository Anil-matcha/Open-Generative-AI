"""
CutAI Export Router
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import json

from ..models.database import get_db, Project, Scene, Script, Shot
from ..models.schemas import ExportRequest

router = APIRouter()


@router.post("/json")
def export_json(data: ExportRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    scenes = db.query(Scene).filter(Scene.project_id == data.project_id).order_by(Scene.order_index).all()
    script = db.query(Script).filter(Script.project_id == data.project_id).first()
    
    export_data = {
        "project": {
            "id": project.id,
            "name": project.name,
            "genre": project.genre,
            "premise": project.premise,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None
        },
        "script": script.raw_script if script else None,
        "scenes": [
            {
                "id": scene.id,
                "scene_number": scene.scene_number,
                "description": scene.description,
                "shot_type": scene.shot_type,
                "camera_angle": scene.camera_angle,
                "camera_movement": scene.camera_movement,
                "duration": scene.duration,
                "mood": {
                    "tension": scene.mood_tension,
                    "emotion": scene.mood_emotion,
                    "energy": scene.mood_energy,
                    "darkness": scene.mood_darkness
                },
                "soundtrack": {
                    "genre": scene.soundtrack_genre,
                    "tempo": scene.soundtrack_tempo,
                    "instruments": scene.soundtrack_instruments,
                    "reference": scene.soundtrack_reference
                }
            }
            for scene in scenes
        ]
    }
    
    return JSONResponse(content=export_data)


@router.post("/pdf")
def export_pdf(data: ExportRequest, db: Session = Depends(get_db)):
    """Export storyboard as formatted HTML (PDF export requires additional dependencies)"""
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scenes = db.query(Scene).filter(Scene.project_id == data.project_id).order_by(Scene.order_index).all()
    script = db.query(Script).filter(Script.project_id == data.project_id).first()

    # Create HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{project.name} - Storyboard</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .header {{ border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }}
            .scene {{ margin-bottom: 30px; border-left: 4px solid #007acc; padding-left: 20px; }}
            .shot {{ margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }}
            .character {{ margin: 10px 0; padding: 10px; background: #e8f4f8; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{project.name}</h1>
            <p><strong>Genre:</strong> {project.genre or 'N/A'}</p>
            <p><strong>Premise:</strong> {project.premise or 'N/A'}</p>
        </div>
    """

    # Characters section
    if script and script.raw_script:
        try:
            script_data = json.loads(script.raw_script)
            if isinstance(script_data, dict) and 'characters' in script_data:
                html_content += "<h2>Characters</h2>"
                for char in script_data.get('characters', []):
                    html_content += f"""
                    <div class="character">
                        <h3>{char.get('name', 'Unknown')}</h3>
                        <p>{char.get('traits', '')}</p>
                    </div>
                    """
        except:
            pass

    # Scenes section
    html_content += "<h2>Scenes</h2>"
    for scene in scenes:
        html_content += f"""
        <div class="scene">
            <h3>Scene {scene.scene_number}: {scene.title or 'Untitled'}</h3>
            <p>{scene.description or 'No description'}</p>
        """

        # Get shots for this scene
        shots = db.query(Shot).filter(Shot.scene_id == scene.id).order_by(Shot.order_index).all()
        if shots:
            for shot in shots:
                html_content += f"""
                <div class="shot">
                    <strong>{shot.shot_type or 'Shot'}</strong>: {shot.description or 'No description'}
                    {f'<br><em>Prompt: {shot.sd_prompt}</em>' if shot.sd_prompt else ''}
                </div>
                """

        html_content += "</div>"

    html_content += """
    </body>
    </html>
    """

    return JSONResponse(content={
        "html": html_content,
        "filename": f'{project.name.replace(" ", "_")}_storyboard.html',
        "message": "HTML export ready (save as .html file and open in browser)"
    })
