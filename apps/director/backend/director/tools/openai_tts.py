import os
import requests
from typing import Optional, Dict, Any
from openai import OpenAI


PARAMS_CONFIG = {
    "text_to_speech": {
        "model": {
            "type": "string",
            "description": "The TTS model to use",
            "default": "tts-1",
            "enum": ["tts-1", "tts-1-hd"],
        },
        "voice": {
            "type": "string",
            "description": "The voice to use for speech synthesis",
            "default": "alloy",
            "enum": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
        },
        "response_format": {
            "type": "string",
            "description": "The format of the audio response",
            "default": "mp3",
            "enum": ["mp3", "opus", "aac", "flac"],
        },
        "speed": {
            "type": "number",
            "description": "The speed of the generated audio",
            "default": 1.0,
            "minimum": 0.25,
            "maximum": 4.0,
        },
    },
}


class OpenAITTSTool:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise Exception("OpenAI API key not found")

        self.client = OpenAI(api_key=self.api_key)

    def text_to_speech(
        self,
        text: str,
        save_at: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate speech from text using OpenAI's TTS API.
        """
        try:
            model = config.get("model", "tts-1")
            voice = config.get("voice", "alloy")
            response_format = config.get("response_format", "mp3")
            speed = config.get("speed", 1.0)

            response = self.client.audio.speech.create(
                model=model,
                voice=voice,
                input=text,
                response_format=response_format,
                speed=speed,
            )

            # Save the audio file
            with open(save_at, "wb") as f:
                f.write(response.content)

        except Exception as e:
            raise Exception(f"Error generating speech: {type(e).__name__}: {str(e)}")

        return {"status": "success", "audio_path": save_at}