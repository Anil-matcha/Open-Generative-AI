"""
CutAI Scene Analyzer - Generate shot breakdown, mood, soundtrack
"""
from typing import Dict, Any, List
import random

from .llm_client import llm_client


SHOT_TYPES = ["Wide Shot", "Medium Shot", "Close-Up", "Extreme Close-Up", "POV", "Overhead", "Low Angle", "Two-Shot", "Insert Shot"]
CAMERA_ANGLES = ["Eye Level", "High Angle", "Low Angle", "Dutch Angle", "Bird's Eye", "Worm's Eye"]
CAMERA_MOVEMENTS = ["Static", "Pan Left", "Pan Right", "Tilt Up", "Tilt Down", "Dolly In", "Dolly Out", "Tracking Shot", "Handheld", "Crane Up", "Crane Down"]
TIME_OF_DAY = ["Day", "Night", "Dawn", "Dusk", "Golden Hour", "Overcast", "Interior - Day", "Interior - Night"]

MOOD_DESCRIPTIONS = {
    "tension": ["Calm", "Building", "Suspenseful", "Intense", "Climactic"],
    "emotion": ["Neutral", "Melancholic", "Joyful", "Romantic", "Nostalgic"],
    "energy": ["Low", "Steady", "Pacing", "Dynamic", "Explosive"],
    "darkness": ["Bright", "Balanced", "Moody", "Dark", "Noir"]
}

SOUNDTRACK_GENRES = ["Orchestral", "Electronic", "Ambient", "Jazz", "Rock", "Classical", "Synthwave", "Acoustic", "Hip-Hop", "World"]
SOUNDTRACK_TEMPOS = ["Slow", "Medium", "Fast", "Building", "Pulsing", "Erratic"]
INSTRUMENTS = ["Piano", "Strings", "Synth", "Guitar", "Drums", "Bass", "Orchestra", "Electronic Beats", "Ambient Pads"]


class SceneAnalyzer:
    def __init__(self):
        self.client = llm_client

    async def analyze_scene(self, scene_data: Dict[str, Any]) -> Dict[str, Any]:
        description = scene_data.get("description", "")
        scene_number = scene_data.get("scene_number", 1)
        
        analysis = await self._generate_analysis(description)
        
        scene_mood = {
            "mood_tension": analysis.get("mood_tension", round(random.uniform(0.3, 0.9), 2)),
            "mood_emotion": analysis.get("mood_emotion", round(random.uniform(0.3, 0.9), 2)),
            "mood_energy": analysis.get("mood_energy", round(random.uniform(0.3, 0.9), 2)),
            "mood_darkness": analysis.get("mood_darkness", round(random.uniform(0.2, 0.8), 2)),
        }
        
        shots_data = analysis.get("shots", [])
        if not shots_data:
            shots_data = self._generate_default_shots(description, scene_number, scene_mood)
        
        soundtrack = analysis.get("soundtrack", {})
        
        return {
            "title": analysis.get("title", f"Scene {scene_number}"),
            "time_of_day": analysis.get("time_of_day", random.choice(TIME_OF_DAY)),
            "location": analysis.get("location", "TBD"),
            "mood_tension": scene_mood["mood_tension"],
            "mood_emotion": scene_mood["mood_emotion"],
            "mood_energy": scene_mood["mood_energy"],
            "mood_darkness": scene_mood["mood_darkness"],
            "soundtrack_genre": soundtrack.get("genre", random.choice(SOUNDTRACK_GENRES)),
            "soundtrack_tempo": soundtrack.get("tempo", random.choice(SOUNDTRACK_TEMPOS)),
            "soundtrack_instruments": soundtrack.get("instruments", random.sample(INSTRUMENTS, 3)),
            "soundtrack_reference": soundtrack.get("reference", self._generate_music_reference()),
            "shots": shots_data
        }

    def _generate_default_shots(self, description: str, scene_number: int, mood: Dict[str, float]) -> List[Dict[str, Any]]:
        num_shots = random.randint(2, 4)
        shots = []
        
        shot_sequence = ["Wide Shot", "Medium Shot", "Close-Up", "Two-Shot"]
        
        for i in range(num_shots):
            shots.append({
                "shot_number": i + 1,
                "shot_type": random.choice(SHOT_TYPES) if i > 0 else shot_sequence[min(i, len(shot_sequence)-1)],
                "camera_angle": random.choice(CAMERA_ANGLES),
                "camera_movement": random.choice(CAMERA_MOVEMENTS),
                "description": self._generate_shot_description(description, i, num_shots),
                "duration": round(random.uniform(2.0, 5.0), 1),
                "sd_prompt": self._generate_sd_prompt(description, mood)
            })
        
        return shots

    def _generate_shot_description(self, scene_desc: str, shot_index: int, total_shots: int) -> str:
        if shot_index == 0:
            return f"Establish {scene_desc[:50]}..."
        elif shot_index == total_shots - 1:
            return f"Close reaction: {scene_desc[:40]}..."
        else:
            return f"Action continues: {scene_desc[:45]}..."

    def _generate_sd_prompt(self, description: str, mood: Dict[str, float]) -> str:
        darkness = mood.get("mood_darkness", 0.5)
        tension = mood.get("mood_tension", 0.5)
        
        style = "cinematic film still, 35mm"
        if tension > 0.7:
            style += ", dramatic lighting, tension"
        if darkness > 0.6:
            style += ", noir, high contrast"
        
        return f"{description}, {style}, professional cinematography"

    async def _generate_analysis(self, description: str) -> Dict[str, Any]:
        prompt = f"""Analyze this movie scene and provide a JSON response with full cinematography breakdown:

Scene: {description}

Return a JSON object with:
{{
  "title": "Scene title",
  "time_of_day": "Day" or "Night" or "Dawn" etc,
  "location": "Location description",
  "mood_tension": 0.7 (0-1 scale),
  "mood_emotion": 0.5 (0-1 scale),
  "mood_energy": 0.6 (0-1 scale),
  "mood_darkness": 0.4 (0-1 scale),
  "soundtrack": {{
    "genre": "Orchestral",
    "tempo": "Medium",
    "instruments": ["Piano", "Strings"],
    "reference": "Hans Zimmer-style tension track"
  }},
  "shots": [
    {{
      "shot_number": 1,
      "shot_type": "Wide Shot",
      "camera_angle": "Eye Level",
      "camera_movement": "Tracking Shot",
      "description": "Establishing shot of...",
      "duration": 4.0,
      "sd_prompt": "Full scene description for AI image generation..."
    }},
    {{
      "shot_number": 2,
      "shot_type": "Close-Up",
      "camera_angle": "Low Angle",
      "camera_movement": "Static",
      "description": "Character reaction...",
      "duration": 3.0,
      "sd_prompt": "Close-up scene description for AI image generation..."
    }}
  ]
}}

Return ONLY the JSON object. Generate 2-4 shots per scene."""

        try:
            response = await self.client.generate(
                prompt=prompt,
                system_prompt="You are a film director and cinematographer. Be specific and creative. Generate 2-4 shots per scene with detailed descriptions."
            )
            return self._parse_json(response)
        except Exception:
            return {}

    def _parse_json(self, response: str) -> Dict[str, Any]:
        import json
        
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        return json.loads(response.strip())

    def _generate_music_reference(self) -> str:
        references = [
            "Hans Zimmer-style tension",
            "Vangelis synthwave",
            "Quentin Tarantino soundtrack",
            "Christopher Nolan thriller",
            "Wes Anderson whimsical",
            "David Fincher dark"
        ]
        return random.choice(references)

    async def analyze_all_scenes(self, scenes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        analyzed = []
        for scene in scenes:
            analysis = await self.analyze_scene(scene)
            analyzed.append({**scene, **analysis})
        return analyzed


scene_analyzer = SceneAnalyzer()
