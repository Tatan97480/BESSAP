-- BE STRONGER V22 — Supabase schema
-- Run in Supabase SQL Editor.
create extension if not exists "pgcrypto";

create type public.user_role as enum ('coach','client','admin');
create type public.access_type as enum ('coaching','premium','coach','none');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Athlète',
  role public.user_role not null default 'client',
  access public.access_type not null default 'premium',
  weight numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_clients (
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coach_id, client_id)
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  code text unique not null,
  used_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  weeks int not null default 8,
  sessions_per_week int not null default 4,
  created_at timestamptz not null default now()
);

create table if not exists public.program_assignments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  start_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  exercise text not null,
  sets int,
  reps int,
  weight numeric,
  rpe numeric,
  duration_seconds int,
  completed_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.coach_clients enable row level security;
alter table public.invites enable row level security;
alter table public.programs enable row level security;
alter table public.program_assignments enable row level security;
alter table public.workout_logs enable row level security;

-- Profile: users can read/update themselves.
drop policy if exists "profile_self_select" on public.profiles;
create policy "profile_self_select" on public.profiles for select using (id = auth.uid());
drop policy if exists "profile_self_update" on public.profiles;
create policy "profile_self_update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Coach can see only linked clients; client can see only their own link.
drop policy if exists "coach_client_select" on public.coach_clients;
create policy "coach_client_select" on public.coach_clients for select using (coach_id = auth.uid() or client_id = auth.uid());

-- Programs: coach owns them; clients can see programs assigned to them.
drop policy if exists "program_select" on public.programs;
create policy "program_select" on public.programs for select using (
  coach_id = auth.uid() or exists (
    select 1 from public.program_assignments pa
    where pa.program_id = programs.id and pa.client_id = auth.uid()
  )
);
drop policy if exists "program_insert_coach" on public.programs;
create policy "program_insert_coach" on public.programs for insert with check (coach_id = auth.uid());

-- Assignments: coach can manage their own assignments; client can read their own.
drop policy if exists "assignment_select" on public.program_assignments;
create policy "assignment_select" on public.program_assignments for select using (
  client_id = auth.uid() or exists (
    select 1 from public.programs p where p.id = program_id and p.coach_id = auth.uid()
  )
);
drop policy if exists "assignment_insert_coach" on public.program_assignments;
create policy "assignment_insert_coach" on public.program_assignments for insert with check (
  exists (select 1 from public.programs p where p.id = program_id and p.coach_id = auth.uid())
);

-- Workout logs: client owns their logs; coach can see linked clients' logs.
drop policy if exists "logs_select" on public.workout_logs;
create policy "logs_select" on public.workout_logs for select using (
  client_id = auth.uid() or exists (
    select 1 from public.coach_clients cc where cc.coach_id = auth.uid() and cc.client_id = workout_logs.client_id
  )
);
drop policy if exists "logs_insert_client" on public.workout_logs;
create policy "logs_insert_client" on public.workout_logs for insert with check (client_id = auth.uid());

-- New auth users get a profile. Role/access can be refined by a secure server-side onboarding function.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,name,role,access)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name','Athlète'),
    case when new.raw_user_meta_data->>'role'='coach' then 'coach'::public.user_role else 'client'::public.user_role end,
    case when new.raw_user_meta_data->>'role'='coach' then 'coach'::public.access_type else 'premium'::public.access_type end
  ) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- IMPORTANT: production onboarding should validate invite codes in a server-side function/Edge Function.
