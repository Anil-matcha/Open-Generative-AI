"""
CutAI Script Parser - Generate screenplay from genre/premise
"""
from typing import List, Dict, Any

from .llm_client import llm_client


SCRIPT_GENERATION_PROMPT = """You are a professional screenplay writer. Generate a complete short film screenplay based on the following genre and premise.

Genre: {genre}
Premise: {premise}

Generate a screenplay with 6-10 scenes. Each scene should include:
1. Scene number and location (INT./EXT.)
2. A brief description of the action (2-3 sentences)
3. Character dialogue where appropriate

Format your response as a JSON array of scene objects with this structure:
{{
  "scene_number": 1,
  "location": "INT. COFFEE SHOP - DAY",
  "description": "A mysterious stranger enters...",
  "dialogue": "CHARACTER: Sample dialogue here"
}}

Return ONLY the JSON array, no other text."""


class ScriptParser:
    def __init__(self):
        self.client = llm_client

    async def generate_script(self, genre: str, premise: str) -> List[Dict[str, Any]]:
        prompt = SCRIPT_GENERATION_PROMPT.format(genre=genre, premise=premise)
        
        response = await self.client.generate(
            prompt=prompt,
            system_prompt="You are an expert screenplay writer. Be creative but concise."
        )
        
        try:
            scenes = self._parse_json_response(response)
            return scenes
        except Exception as e:
            return self._fallback_parse(response, e)

    def _parse_json_response(self, response: str) -> List[Dict[str, Any]]:
        import json
        
        response = response.strip()
        if response.startswith("```json"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        
        return json.loads(response.strip())

    def _fallback_parse(self, response: str, original_error) -> List[Dict[str, Any]]:
        import json
        import re
        
        scene_blocks = re.split(r'\n(?=Scene\s*\d+)', response, flags=re.IGNORECASE)
        scenes = []
        
        for i, block in enumerate(scene_blocks[:10], 1):
            lines = block.strip().split('\n')
            description = ' '.join(lines[:3]) if lines else f"Scene {i}"
            scenes.append({
                "scene_number": i,
                "location": "LOCATION",
                "description": description,
                "dialogue": ""
            })
        
        if not scenes:
            raise original_error
        
        return scenes


script_parser = ScriptParser()
