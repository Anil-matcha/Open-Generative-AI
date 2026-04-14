"""
CutAI LLM Client - Groq/Ollama wrapper
"""
import os
import json
from typing import Optional, Dict, Any

from ..config import settings


class LLMClient:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.groq_api_key = settings.GROQ_API_KEY
        self.ollama_base_url = settings.OLLAMA_BASE_URL
        self.ollama_model = settings.OLLAMA_MODEL

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if self.provider == "groq":
            return await self._groq_generate(prompt, system_prompt)
        elif self.provider == "ollama":
            return await self._ollama_generate(prompt, system_prompt)
        else:
            raise ValueError(f"Unknown LLM provider: {self.provider}")

    async def _groq_generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        import httpx
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "temperature": 0.7
                },
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _ollama_generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        import httpx
        
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ollama_base_url}/api/generate",
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()
            data = response.json()
            return data["response"]


llm_client = LLMClient()
