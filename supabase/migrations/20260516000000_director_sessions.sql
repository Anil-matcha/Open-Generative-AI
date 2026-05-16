-- Director sessions and conversation history tables
-- Supports the director app's chat, session management, and reasoning context

CREATE TABLE IF NOT EXISTS director_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    conv_id TEXT NOT NULL DEFAULT '',
    collection_id TEXT,
    video_id TEXT,
    video_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_director_sessions_session_id ON director_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_director_sessions_conv_id ON director_sessions(conv_id);

CREATE TABLE IF NOT EXISTS director_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES director_sessions(session_id) ON DELETE CASCADE,
    conv_id TEXT NOT NULL DEFAULT '',
    msg_id TEXT NOT NULL UNIQUE,
    msg_type TEXT NOT NULL CHECK (msg_type IN ('input', 'output')),
    content JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    agents JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_director_messages_session_id ON director_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_director_messages_msg_type ON director_messages(msg_type);
CREATE INDEX IF NOT EXISTS idx_director_messages_created_at ON director_messages(created_at);

CREATE TABLE IF NOT EXISTS director_context_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES director_sessions(session_id) ON DELETE CASCADE,
    content TEXT,
    tool_calls JSONB,
    tool_call_id TEXT,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_director_context_session_id ON director_context_messages(session_id);

-- Enable RLS
ALTER TABLE director_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_context_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies: allow all for now (edge function uses service role)
CREATE POLICY "Allow all access to director_sessions" ON director_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to director_messages" ON director_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to director_context_messages" ON director_context_messages FOR ALL USING (true) WITH CHECK (true);
