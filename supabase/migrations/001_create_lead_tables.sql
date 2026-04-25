-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  source TEXT DEFAULT 'video_personalization',
  status TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT '{}',
  personalization_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  city TEXT,
  country TEXT,
  tags TEXT[] DEFAULT '{}',
  lead_id INTEGER REFERENCES leads(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_sends table for tracking
CREATE TABLE IF NOT EXISTS email_sends (
  id SERIAL PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  personalization_data JSONB DEFAULT '{}',
  lead_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_to_email ON email_sends(to_email);
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at ON email_sends(sent_at);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own leads" ON leads
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.uid()::text = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE USING (auth.uid()::text = created_by OR created_by IS NULL);

-- Similar policies for contacts and email_sends tables
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid()::text = created_by OR created_by IS NULL);

CREATE POLICY "Users can view their own email sends" ON email_sends
  FOR SELECT USING (auth.uid()::text = created_by OR created_by IS NULL);