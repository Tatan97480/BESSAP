-- BE STRONGER V22
-- Programme builder / exercise library / session logs.
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  equipment text,
  video_url text,
  default_sets int default 3,
  default_reps int default 10,
  rest_seconds int default 90,
  created_at timestamptz not null default now()
);

create table if not exists public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week_number int not null default 1,
  day_name text not null,
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null default 1,
  sets int not null default 3,
  reps int not null default 10,
  rest_seconds int not null default 90,
  target_rpe numeric,
  notes text
);

alter table public.exercises enable row level security;
alter table public.program_sessions enable row level security;
alter table public.session_exercises enable row level security;

drop policy if exists "exercise_read_auth" on public.exercises;
create policy "exercise_read_auth" on public.exercises for select using (auth.uid() is not null);

drop policy if exists "session_access" on public.program_sessions;
create policy "session_access" on public.program_sessions for select using (
  exists(select 1 from public.programs p where p.id=program_id and p.coach_id=auth.uid())
  or exists(select 1 from public.program_assignments pa where pa.program_id=program_sessions.program_id and pa.client_id=auth.uid())
);
drop policy if exists "session_insert_coach" on public.program_sessions;
create policy "session_insert_coach" on public.program_sessions for insert with check (
  exists(select 1 from public.programs p where p.id=program_id and p.coach_id=auth.uid())
);
drop policy if exists "exercise_access" on public.session_exercises;
create policy "exercise_access" on public.session_exercises for select using (
  exists(select 1 from public.program_sessions s join public.programs p on p.id=s.program_id where s.id=session_id and p.coach_id=auth.uid())
  or exists(select 1 from public.program_sessions s join public.program_assignments pa on pa.program_id=s.program_id where s.id=session_id and pa.client_id=auth.uid())
);
drop policy if exists "exercise_insert_coach" on public.session_exercises;
create policy "exercise_insert_coach" on public.session_exercises for insert with check (
  exists(select 1 from public.program_sessions s join public.programs p on p.id=s.program_id where s.id=session_id and p.coach_id=auth.uid())
);

-- Recommended seed examples; adjust IDs if using a custom exercise library.
insert into public.exercises(name,category,equipment,default_sets,default_reps,rest_seconds)
select * from (values
('Développé couché','Poussée','Barre',4,8,90),
('Rowing barre','Tirage','Barre',4,10,90),
('Back squat','Jambes','Barre',4,8,120),
('Élévations latérales','Épaules','Haltères',3,15,60),
('Tractions','Tirage','Poids du corps',4,8,90),
('Echo Bike','Conditioning','Machine',1,15,60),
('Rameur','Conditioning','Machine',1,15,60)
) as v(name,category,equipment,default_sets,default_reps,rest_seconds)
where not exists(select 1 from public.exercises e where e.name=v.name);
