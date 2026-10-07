-- BE STRONGER V20 — onboarding sécurisé
-- À exécuter après supabase_schema.sql.
create or replace function public.accept_coach_invite(p_code text, p_client_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_invite public.invites%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_client_id then
    return jsonb_build_object('ok',false,'message','Non autorisé.');
  end if;
  select * into v_invite from public.invites
  where code=upper(trim(p_code)) and used_by is null
    and (expires_at is null or expires_at > now())
  for update;
  if not found then
    return jsonb_build_object('ok',false,'message','Code invalide ou expiré.');
  end if;
  update public.profiles set access='coaching', role='client' where id=p_client_id;
  insert into public.coach_clients(coach_id,client_id)
  values(v_invite.coach_id,p_client_id)
  on conflict do nothing;
  update public.invites set used_by=p_client_id where id=v_invite.id;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.accept_coach_invite(text,uuid) from public;
grant execute on function public.accept_coach_invite(text,uuid) to authenticated;

-- Coach-only invite creation helper.
create or replace function public.create_coach_invite(p_code text, p_expires_at timestamptz default now()+interval '7 days')
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='coach') then
    return jsonb_build_object('ok',false,'message','Coach requis.');
  end if;
  insert into public.invites(coach_id,code,expires_at) values(auth.uid(),upper(trim(p_code)),p_expires_at);
  return jsonb_build_object('ok',true,'code',upper(trim(p_code)));
exception when unique_violation then
  return jsonb_build_object('ok',false,'message','Code déjà utilisé.');
end;
$$;
revoke all on function public.create_coach_invite(text,timestamptz) from public;
grant execute on function public.create_coach_invite(text,timestamptz) to authenticated;
