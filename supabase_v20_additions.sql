-- BE STRONGER V22
-- Exercise video library + links.

create table if not exists public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid,
  exercise_name text,
  title text not null,
  video_url text not null,
  thumbnail_url text,
  description text,
  duration_seconds int,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.exercise_media enable row level security;

create policy "exercise_media_read_authenticated"
on public.exercise_media for select
to authenticated using (true);

create policy "exercise_media_coach_insert"
on public.exercise_media for insert
to authenticated with check (created_by=auth.uid());

create policy "exercise_media_owner_update"
on public.exercise_media for update
to authenticated using (created_by=auth.uid())
with check (created_by=auth.uid());

create policy "exercise_media_owner_delete"
on public.exercise_media for delete
to authenticated using (created_by=auth.uid());

-- Storage bucket (create in Supabase dashboard if SQL storage permissions are restricted).
insert into storage.buckets (id,name,public)
values ('exercise-videos','exercise-videos',true)
on conflict (id) do nothing;

create policy "exercise_videos_read"
on storage.objects for select
to authenticated using (bucket_id='exercise-videos');

create policy "exercise_videos_upload"
on storage.objects for insert
to authenticated with check (bucket_id='exercise-videos');

create policy "exercise_videos_update"
on storage.objects for update
to authenticated using (bucket_id='exercise-videos')
with check (bucket_id='exercise-videos');

create policy "exercise_videos_delete"
on storage.objects for delete
to authenticated using (bucket_id='exercise-videos');
