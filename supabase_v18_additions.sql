-- BE STRONGER V22
-- Live workout execution, metrics and notifications.

create table if not exists public.session_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_session_id uuid references public.program_sessions(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds int default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_log_id uuid not null references public.session_logs(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  set_number int not null,
  reps int,
  weight numeric,
  rpe numeric,
  rest_seconds int,
  completed_at timestamptz not null default now()
);

create table if not exists public.client_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  metric_date date not null default current_date,
  body_weight numeric,
  waist numeric,
  sleep_hours numeric,
  recovery_score numeric,
  created_at timestamptz not null default now(),
  unique(client_id,metric_date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.session_logs enable row level security;
alter table public.set_logs enable row level security;
alter table public.client_metrics enable row level security;
alter table public.notifications enable row level security;

create policy "session_logs_owner_or_coach" on public.session_logs for select using (
  client_id=auth.uid() or exists(
    select 1 from public.coach_clients cc where cc.coach_id=auth.uid() and cc.client_id=session_logs.client_id
  )
);
create policy "session_logs_client_insert" on public.session_logs for insert with check(client_id=auth.uid());

create policy "set_logs_owner_or_coach" on public.set_logs for select using (
  exists(select 1 from public.session_logs sl where sl.id=session_log_id and (
    sl.client_id=auth.uid() or exists(select 1 from public.coach_clients cc where cc.coach_id=auth.uid() and cc.client_id=sl.client_id)
  ))
);
create policy "set_logs_client_insert" on public.set_logs for insert with check(
  exists(select 1 from public.session_logs sl where sl.id=session_log_id and sl.client_id=auth.uid())
);

create policy "metrics_owner_or_coach" on public.client_metrics for select using (
  client_id=auth.uid() or exists(select 1 from public.coach_clients cc where cc.coach_id=auth.uid() and cc.client_id=client_metrics.client_id)
);
create policy "metrics_client_insert" on public.client_metrics for insert with check(client_id=auth.uid());

create policy "notifications_owner" on public.notifications for select using(user_id=auth.uid());
create policy "notifications_owner_update" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Suggested progression helper: returns the next weight based on recent RPE.
create or replace function public.suggest_next_weight(p_client_id uuid,p_exercise_id uuid,p_current_weight numeric,p_rpe numeric)
returns numeric
language plpgsql
security definer
set search_path=public
as $$
begin
 if auth.uid() <> p_client_id and not exists(select 1 from public.coach_clients where coach_id=auth.uid() and client_id=p_client_id) then
   raise exception 'not authorized';
 end if;
 if p_current_weight is null then return null; end if;
 if p_rpe <= 7 then return round((p_current_weight+2.5)::numeric,1);
 elsif p_rpe <= 8 then return p_current_weight;
 else return greatest(0,round((p_current_weight-2.5)::numeric,1));
 end if;
end;
$$;
