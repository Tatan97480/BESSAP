-- BE STRONGER V22
-- Realtime events + notification center.

create table if not exists public.workout_live_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  client_name text,
  event_type text not null,
  exercise_name text,
  set_number int,
  weight numeric,
  reps int,
  rpe numeric,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.workout_live_events enable row level security;

create policy "live_event_client_insert" on public.workout_live_events
for insert with check (client_id=auth.uid());

create policy "live_event_client_or_coach_read" on public.workout_live_events
for select using (
  client_id=auth.uid()
  or exists(
    select 1 from public.coach_clients cc
    where cc.coach_id=auth.uid() and cc.client_id=workout_live_events.client_id
  )
);

-- Enable Supabase Realtime for the live event table.
do $$
begin
  alter publication supabase_realtime add table public.workout_live_events;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- Helper to create a notification for a coach when one of their clients logs an event.
create or replace function public.notify_coach_live_event()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare c record;
begin
  for c in select coach_id from public.coach_clients where client_id=new.client_id loop
    insert into public.notifications(user_id,type,title,body)
    values(c.coach_id,'workout_live','Nouvelle activité client',
           coalesce(new.client_name,'Client')||' a validé '||coalesce(new.exercise_name,'une série'));
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_coach_live_event on public.workout_live_events;
create trigger trg_notify_coach_live_event
after insert on public.workout_live_events
for each row execute procedure public.notify_coach_live_event();
