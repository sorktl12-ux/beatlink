-- Incremental migration for existing BEATLINK projects.

alter table public.posts add column if not exists recruit_count integer;
alter table public.posts add column if not exists engineer_pay_krw integer;
alter table public.posts add column if not exists engineer_mix_scope text;

drop table if exists public.purchases cascade;
drop table if exists public.beats cascade;
alter table public.profiles drop column if exists credits;
drop function if exists public.buy_beat(uuid, uuid);

create or replace function public.close_deal(
  p_post_id uuid,
  p_requester_id uuid,
  p_requester_name text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
  v_status text;
  v_board text;
  v_recruit integer;
  v_accepted integer;
begin
  select author_id, status, board, recruit_count
  into v_author, v_status, v_board, v_recruit
  from public.posts where id = p_post_id for update;

  if v_author is null then raise exception 'Post not found.'; end if;
  if auth.uid() is distinct from v_author and not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  if v_status = 'completed' then raise exception 'This deal is already closed.'; end if;

  if not exists (
    select 1 from public.requests
    where post_id = p_post_id and requester_id = p_requester_id and status = 'pending'
  ) then
    raise exception 'Request not found or already accepted.';
  end if;

  update public.requests set status = 'accepted'
  where post_id = p_post_id and requester_id = p_requester_id;

  if v_board in ('player', 'producer') and coalesce(v_recruit, 1) > 1 then
    select count(*) into v_accepted from public.requests
    where post_id = p_post_id and status = 'accepted';
    if v_accepted >= v_recruit then
      update public.posts set status = 'completed',
        deal_requester_id = p_requester_id, deal_requester_name = p_requester_name, completed_at = now()
      where id = p_post_id;
    end if;
  else
    update public.posts set status = 'completed',
      deal_requester_id = p_requester_id, deal_requester_name = p_requester_name, completed_at = now()
    where id = p_post_id;
  end if;
end;
$$;

drop policy if exists "audio_write" on storage.objects;
create policy "audio_write" on storage.objects for all to authenticated
  using (bucket_id = 'audio' and (
    public.is_admin() or (
      (storage.foldername(name))[1] = 'posts' and (storage.foldername(name))[2] = auth.uid()::text
    )
  ))
  with check (bucket_id = 'audio' and (
    public.is_admin() or (
      (storage.foldername(name))[1] = 'posts' and (storage.foldername(name))[2] = auth.uid()::text
    )
  ));

drop policy if exists "images_write" on storage.objects;
create policy "images_write" on storage.objects for all to authenticated
  using (bucket_id = 'images' and (
    public.is_admin() or (
      (storage.foldername(name))[1] = 'items' and (storage.foldername(name))[2] = auth.uid()::text
    )
  ))
  with check (bucket_id = 'images' and (
    public.is_admin() or (
      (storage.foldername(name))[1] = 'items' and (storage.foldername(name))[2] = auth.uid()::text
    )
  ));

notify pgrst, 'reload schema';
