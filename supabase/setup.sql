-- Nikita OS 2.0. Run once in Supabase -> SQL Editor.
-- Separate tables; existing project data is not changed.
begin;
create table if not exists public.nos_state (
  id integer primary key check (id = 1),
  body jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists public.nos_sessions (
  token_hash text primary key,
  auth_version text not null,
  expires_at timestamptz not null
);
create table if not exists public.nos_login_limits (
  key text primary key,
  attempts integer not null,
  expires_at timestamptz not null
);
alter table public.nos_state enable row level security;
alter table public.nos_sessions enable row level security;
alter table public.nos_login_limits enable row level security;
revoke all on public.nos_state, public.nos_sessions, public.nos_login_limits from public, anon, authenticated;
grant all on public.nos_state, public.nos_sessions, public.nos_login_limits to service_role;
-- No policies for anon/authenticated: the browser cannot read these tables.
-- Only the Vercel server, after PIN authentication, uses the secret key.
create or replace function public.nos_take_login_attempt()
returns boolean language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  perform pg_advisory_xact_lock(7825719);
  delete from public.nos_sessions where expires_at < now();
  insert into public.nos_login_limits(key, attempts, expires_at)
  values ('login', 1, now() + interval '15 minutes')
  on conflict (key) do update set
    attempts = case when nos_login_limits.expires_at <= now() then 1 else nos_login_limits.attempts + 1 end,
    expires_at = case when nos_login_limits.expires_at <= now() then now() + interval '15 minutes' else nos_login_limits.expires_at end
  returning attempts into n;
  return n <= 8;
end;
$$;
create or replace function public.nos_save_state(p_expected_revision bigint, p_body jsonb)
returns bigint language plpgsql security invoker set search_path = public as $$
declare new_revision bigint;
begin
  update public.nos_state
    set body = p_body, revision = revision + 1, updated_at = now()
    where id = 1 and revision = p_expected_revision
    returning revision into new_revision;
  return new_revision;
end;
$$;
revoke all on function public.nos_take_login_attempt() from public, anon, authenticated;
revoke all on function public.nos_save_state(bigint,jsonb) from public, anon, authenticated;
grant execute on function public.nos_take_login_attempt() to service_role;
grant execute on function public.nos_save_state(bigint,jsonb) to service_role;
commit;
