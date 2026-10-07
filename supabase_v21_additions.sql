-- BE STRONGER V22
-- Performance history, PR and intelligent load recommendations.

create table if not exists public.performance_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid,
  exercise_name text not null,
  weight_kg numeric not null,
  reps int not null,
  rpe numeric,
  volume_kg numeric generated always as (weight_kg * reps) stored,
  estimated_1rm numeric generated always as (weight_kg * (1 + reps / 30.0)) stored,
  created_at timestamptz not null default now()
);

alter table public.performance_logs enable row level security;

create policy "performance_client_insert"
on public.performance_logs for insert
to authenticated with check (client_id=auth.uid());

create policy "performance_client_read"
on public.performance_logs for select
to authenticated using (
  client_id=auth.uid()
  or exists(select 1 from public.coach_clients cc
            where cc.coach_id=auth.uid()
            and cc.client_id=performance_logs.client_id)
);

-- Coach-only update/delete for their clients can be added if required by workflow.

create or replace function public.recommend_next_weight(
  p_client_id uuid,
  p_exercise_name text
) returns numeric
language sql
security definer
set search_path=public
as $$
  select case
    when rpe <= 7 then weight_kg + 2.5
    when rpe <= 8 then weight_kg
    else greatest(0,weight_kg - 2.5)
  end
  from public.performance_logs
  where client_id=p_client_id and exercise_name=p_exercise_name
  order by created_at desc
  limit 1;
$$;

create index if not exists performance_logs_client_exercise_idx
on public.performance_logs(client_id,exercise_name,created_at desc);
