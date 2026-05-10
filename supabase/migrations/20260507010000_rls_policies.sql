create or replace function is_workspace_member(ws uuid) returns boolean language sql stable as $$
  select exists(select 1 from workspaces w where w.id=ws and w.owner_id=auth.uid())
  or exists(select 1 from workspace_members wm where wm.workspace_id=ws and wm.user_id=auth.uid() and wm.status='active');
$$;

do $$ declare t text; begin
  foreach t in array array['profiles','workspaces','workspace_members','campaigns','contacts','personalized_scripts','generation_jobs','personalized_videos','video_events','leads','brand_kits','usage_credits','api_keys_optional_byok']
  loop execute format('alter table %I enable row level security', t); end loop;
end $$;

create policy profiles_self_read on profiles for select using (id=auth.uid());
create policy profiles_self_update on profiles for update using (id=auth.uid());
create policy workspace_owner_all on workspaces for all using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy workspace_members_read on workspaces for select using (is_workspace_member(id));
