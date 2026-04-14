"""
CutAI Backend Configuration
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/cutai.db")

PORT = int(os.getenv("CUTAI_PORT", "8001"))

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

class Settings:
    PORT = PORT
    DATABASE_URL = DATABASE_URL
    LLM_PROVIDER = LLM_PROVIDER
    GROQ_API_KEY = GROQ_API_KEY
    OLLAMA_BASE_URL = OLLAMA_BASE_URL
    OLLAMA_MODEL = OLLAMA_MODEL

settings = Settings()
