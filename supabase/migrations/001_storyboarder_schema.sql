-- Storyboarder Database Schema
-- Migration for AI Storyboarder application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE storyboarder_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    genre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts table
CREATE TABLE storyboarder_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES storyboarder_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    logline TEXT,
    raw_text TEXT NOT NULL,
    total_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scenes table
CREATE TABLE storyboarder_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID NOT NULL REFERENCES storyboarder_scripts(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    time_of_day TEXT,
    description TEXT,
    characters JSONB DEFAULT '[]',
    mood_tension DECIMAL(3,2) CHECK (mood_tension >= 0 AND mood_tension <= 1),
    mood_emotion TEXT,
    mood_energy DECIMAL(3,2) CHECK (mood_energy >= 0 AND mood_energy <= 1),
    mood_darkness DECIMAL(3,2) CHECK (mood_darkness >= 0 AND mood_darkness <= 1),
    mood_overall TEXT,
    soundtrack_genre TEXT,
    soundtrack_tempo TEXT,
    soundtrack_instruments JSONB DEFAULT '[]',
    soundtrack_reference TEXT,
    soundtrack_energy DECIMAL(3,2) CHECK (soundtrack_energy >= 0 AND soundtrack_energy <= 1),
    frame_image_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shots table
CREATE TABLE storyboarder_shots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID NOT NULL REFERENCES storyboarder_scenes(id) ON DELETE CASCADE,
    shot_number INTEGER NOT NULL,
    shot_type TEXT,
    camera_angle TEXT,
    camera_movement TEXT,
    description TEXT,
    dialogue TEXT,
    duration_seconds INTEGER DEFAULT 0,
    sd_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_storyboarder_scripts_project_id ON storyboarder_scripts(project_id);
CREATE INDEX idx_storyboarder_scenes_script_id ON storyboarder_scenes(script_id);
CREATE INDEX idx_storyboarder_shots_scene_id ON storyboarder_shots(scene_id);

-- Row Level Security (RLS)
ALTER TABLE storyboarder_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboarder_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboarder_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyboarder_shots ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - adjust based on auth requirements)
CREATE POLICY "Allow all operations on storyboarder_projects" ON storyboarder_projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on storyboarder_scripts" ON storyboarder_scripts FOR ALL USING (true);
CREATE POLICY "Allow all operations on storyboarder_scenes" ON storyboarder_scenes FOR ALL USING (true);
CREATE POLICY "Allow all operations on storyboarder_shots" ON storyboarder_shots FOR ALL USING (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_storyboarder_projects_updated_at BEFORE UPDATE ON storyboarder_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storyboarder_scripts_updated_at BEFORE UPDATE ON storyboarder_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storyboarder_scenes_updated_at BEFORE UPDATE ON storyboarder_scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storyboarder_shots_updated_at BEFORE UPDATE ON storyboarder_shots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();