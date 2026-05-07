-- VideoRemix MVP schema + RLS
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  plan text default 'free',
  role text default 'user',
  created_at timestamptz default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text,
  brand_name text,
  logo_url text,
  primary_color text,
  cta_button_color text,
  custom_footer_text text,
  created_at timestamptz default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text default 'personalized_video',
  base_video_url text,
  base_thumbnail_url text,
  offer text,
  audience text,
  cta_text text,
  cta_url text,
  calendar_url text,
  personalization_mode text default 'personalized_page',
  status text default 'draft',
  landing_page_slug text unique,
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  company text,
  website text,
  industry text,
  city text,
  custom_fields jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.personalized_scripts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  hook text,
  script text,
  subject_line text,
  email_body text,
  cta text,
  prompt jsonb default '{}'::jsonb,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  provider text not null,
  provider_job_id text,
  workflow_id text,
  status text default 'queued',
  input jsonb default '{}'::jsonb,
  output jsonb default '{}'::jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.personalized_videos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  script_id uuid references public.personalized_scripts(id) on delete set null,
  generation_job_id uuid references public.generation_jobs(id) on delete set null,
  video_url text,
  thumbnail_url text,
  landing_page_slug text unique,
  landing_page_url text,
  embed_code text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table if not exists public.video_events (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.personalized_videos(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  video_id uuid references public.personalized_videos(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  name text,
  email text,
  phone text,
  message text,
  form_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.muapi_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  workflow_id text not null,
  input_schema jsonb default '{}'::jsonb,
  output_type text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create or replace function public.is_workspace_member(_workspace_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.workspaces w
    left join public.workspace_members wm on wm.workspace_id = w.id
    where w.id = _workspace_id and (w.owner_id = auth.uid() or wm.user_id = auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.campaigns enable row level security;
alter table public.contacts enable row level security;
alter table public.personalized_scripts enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.personalized_videos enable row level security;
alter table public.video_events enable row level security;
alter table public.leads enable row level security;
alter table public.muapi_workflows enable row level security;

create policy if not exists "profiles self access" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy if not exists "workspace members read" on public.workspaces for select using (public.is_workspace_member(id));
create policy if not exists "workspace owner write" on public.workspaces for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy if not exists "workspace members membership access" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy if not exists "workspace owner manage members" on public.workspace_members for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

create policy if not exists "campaign workspace access" on public.campaigns for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "contacts workspace access" on public.contacts for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "scripts via campaign workspace" on public.personalized_scripts for all using (exists(select 1 from public.campaigns c where c.id = campaign_id and public.is_workspace_member(c.workspace_id))) with check (exists(select 1 from public.campaigns c where c.id = campaign_id and public.is_workspace_member(c.workspace_id)));
create policy if not exists "jobs workspace access" on public.generation_jobs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "videos workspace access" on public.personalized_videos for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "events via campaign workspace" on public.video_events for select using (exists(select 1 from public.campaigns c where c.id = campaign_id and public.is_workspace_member(c.workspace_id)));
create policy if not exists "leads workspace access" on public.leads for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy if not exists "muapi workflows readable" on public.muapi_workflows for select using (true);
