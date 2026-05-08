-- Create templates table
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- JSON string for Popcorn.js data
  content_type TEXT DEFAULT 'application/x-popcorn',
  thumbnail_url TEXT,
  category TEXT,
  tags TEXT[], -- Array of tags
  author_id UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create template_categories table
CREATE TABLE template_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- JSON string for project data
  template_id UUID REFERENCES templates(id),
  author_id UUID REFERENCES auth.users(id),
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft', -- draft, published, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create media_assets table
CREATE TABLE media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  type TEXT, -- 'video', 'image', 'audio'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates (public read, authenticated write)
CREATE POLICY "Templates are viewable by everyone" ON templates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create templates" ON templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for media assets
CREATE POLICY "Users can view their own media" ON media_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload media" ON media_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_author ON templates(author_id);
CREATE INDEX idx_projects_author ON projects(author_id);
CREATE INDEX idx_projects_template ON projects(template_id);
CREATE INDEX idx_media_user ON media_assets(user_id);

-- Insert sample template categories
INSERT INTO template_categories (name, description, priority) VALUES
  ('Business', 'Professional business templates', 1),
  ('Marketing', 'Marketing and promotional content', 2),
  ('Education', 'Educational and tutorial content', 3),
  ('Entertainment', 'Entertainment and social media', 4),
  ('Product', 'Product demonstrations', 5);

-- Insert sample templates
INSERT INTO templates (title, description, thumbnail_url, category, tags, is_public) VALUES
  ('Business Presentation', 'Professional business presentation template', 'https://via.placeholder.com/300x200/4f46e5/ffffff?text=Business+Template', 'business', ARRAY['presentation', 'corporate', 'professional'], true),
  ('Product Demo', 'Showcase your product features', 'https://via.placeholder.com/300x200/059669/ffffff?text=Product+Demo', 'product', ARRAY['demo', 'product', 'features'], true),
  ('Customer Story', 'Share customer testimonials', 'https://via.placeholder.com/300x200/dc2626/ffffff?text=Customer+Story', 'marketing', ARRAY['testimonial', 'customer', 'story'], true),
  ('Tutorial Video', 'Educational content template', 'https://via.placeholder.com/300x200/7c3aed/ffffff?text=Tutorial', 'education', ARRAY['tutorial', 'how-to', 'education'], true);