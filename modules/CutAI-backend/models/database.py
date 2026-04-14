"""
CutAI Database Models
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

from ..config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    genre = Column(String(100), nullable=True)
    premise = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    script = relationship("Script", back_populates="project", uselist=False, cascade="delete-orphan")


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    raw_script = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="script")


class Scene(Base):
    __tablename__ = "scenes"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    scene_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    time_of_day = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    duration = Column(Float, default=3.0)
    
    mood_tension = Column(Float, default=0.5)
    mood_emotion = Column(Float, default=0.5)
    mood_energy = Column(Float, default=0.5)
    mood_darkness = Column(Float, default=0.5)
    
    soundtrack_genre = Column(String(100), nullable=True)
    soundtrack_tempo = Column(String(50), nullable=True)
    soundtrack_instruments = Column(JSON, nullable=True)
    soundtrack_reference = Column(String(255), nullable=True)
    
    order_index = Column(Integer, default=0)

    project = relationship("Project", back_populates="scenes")
    shots = relationship("Shot", back_populates="scene", cascade="all, delete-orphan")


class Shot(Base):
    __tablename__ = "shots"

    id = Column(Integer, primary_key=True, index=True)
    scene_id = Column(Integer, ForeignKey("scenes.id"))
    shot_number = Column(Integer, nullable=False)
    shot_type = Column(String(50), nullable=True)
    camera_angle = Column(String(50), nullable=True)
    camera_movement = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    duration = Column(Float, default=3.0)
    sd_prompt = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    scene = relationship("Scene", back_populates="shots")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
