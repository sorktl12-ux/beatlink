-- BEATLINK — Supabase schema (production)
-- Run in Supabase SQL Editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  username        text unique not null,
  full_name       text,
  phone           text,
  role            text not null default 'player',
  seller_approved boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists seller_approved boolean not null default false;

create table if not exists public.posts (
  id                  uuid primary key default gen_random_uuid(),
  board               text not null,
  author_id           uuid not null references public.profiles (id) on delete cascade,
  author_name         text not null,
  title               text not null,
  description         text default '',
  audio_url           text,
  audio_path          text,
  status              text not null default 'approved',
  deal_requester_id   uuid,
  deal_requester_name text,
  recruit_count       integer,
  engineer_pay_krw    integer,
  engineer_mix_scope  text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

alter table public.posts add column if not exists recruit_count integer;
alter table public.posts add column if not exists engineer_pay_krw integer;
alter table public.posts add column if not exists engineer_mix_scope text;

create table if not exists public.requests (
  id             uuid primary key default gen_random_uuid(),
  post_id        uuid not null references public.posts (id) on delete cascade,
  requester_id   uuid not null,
  requester_name text not null,
  message        text default '',
  status         text not null default 'pending',
  created_at     timestamptz not null default now(),
  unique (post_id, requester_id)
);

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles (id) on delete cascade,
  seller_name text not null,
  title       text not null,
  description text default '',
  price       integer not null default 0,
  image_url   text,
  image_path  text,
  status      text not null default 'available',
  created_at  timestamptz not null default now()
);

-- Legacy beat-shop tables (removed from app)
drop table if exists public.purchases cascade;
drop table if exists public.beats cascade;
alter table public.profiles drop column if exists credits;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
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

  if v_author is null then
    raise exception 'Post not found.';
  end if;
  if auth.uid() is distinct from v_author and not public.is_admin() then
    raise exception 'Not authorized.';
  end if;
  if v_status = 'completed' then
    raise exception 'This deal is already closed.';
  end if;

  if not exists (
    select 1 from public.requests
    where post_id = p_post_id and requester_id = p_requester_id and status = 'pending'
  ) then
    raise exception 'Request not found or already accepted.';
  end if;

  update public.requests
  set status = 'accepted'
  where post_id = p_post_id and requester_id = p_requester_id;

  if v_board in ('player', 'producer') and coalesce(v_recruit, 1) > 1 then
    select count(*) into v_accepted
    from public.requests
    where post_id = p_post_id and status = 'accepted';

    if v_accepted >= v_recruit then
      update public.posts
      set status = 'completed',
          deal_requester_id = p_requester_id,
          deal_requester_name = p_requester_name,
          completed_at = now()
      where id = p_post_id;
    end if;
  else
    update public.posts
    set status = 'completed',
        deal_requester_id = p_requester_id,
        deal_requester_name = p_requester_name,
        completed_at = now()
    where id = p_post_id;
  end if;
end;
$$;

drop function if exists public.buy_beat(uuid, uuid);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.requests enable row level security;
alter table public.items enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_approved() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (seller_approved or role = 'admin')
  );
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','posts','requests','items'] loop
    execute format('drop policy if exists "demo_all" on public.%I;', t);
  end loop;
end $$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (
    auth.uid() = id
    and (
      public.is_admin()
      or (coalesce(seller_approved, false) = false and role <> 'admin')
    )
  );

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles for delete
  using (public.is_admin());

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select using (true);

drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts for insert
  with check (auth.uid() = author_id and public.is_approved());

drop policy if exists "posts_update" on public.posts;
create policy "posts_update" on public.posts for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete" on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());

drop policy if exists "requests_select" on public.requests;
create policy "requests_select" on public.requests for select
  using (
    auth.uid() = requester_id
    or public.is_admin()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

drop policy if exists "requests_insert" on public.requests;
create policy "requests_insert" on public.requests for insert
  with check (auth.uid() = requester_id);

drop policy if exists "requests_update" on public.requests;
create policy "requests_update" on public.requests for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "requests_delete" on public.requests;
create policy "requests_delete" on public.requests for delete
  using (
    public.is_admin()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

drop policy if exists "items_select" on public.items;
create policy "items_select" on public.items for select using (true);

drop policy if exists "items_insert" on public.items;
create policy "items_insert" on public.items for insert
  with check (auth.uid() = seller_id and public.is_approved());

drop policy if exists "items_update" on public.items;
create policy "items_update" on public.items for update
  using (auth.uid() = seller_id or public.is_admin())
  with check (auth.uid() = seller_id or public.is_admin());

drop policy if exists "items_delete" on public.items;
create policy "items_delete" on public.items for delete
  using (auth.uid() = seller_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles','posts','requests','items'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when others then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists "audio_read" on storage.objects;
drop policy if exists "audio_write" on storage.objects;
drop policy if exists "images_read" on storage.objects;
drop policy if exists "images_write" on storage.objects;

create policy "audio_read" on storage.objects for select
  using (bucket_id = 'audio');

create policy "audio_write" on storage.objects for all to authenticated
  using (
    bucket_id = 'audio'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = 'posts'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  )
  with check (
    bucket_id = 'audio'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = 'posts'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

create policy "images_read" on storage.objects for select
  using (bucket_id = 'images');

create policy "images_write" on storage.objects for all to authenticated
  using (
    bucket_id = 'images'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = 'items'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  )
  with check (
    bucket_id = 'images'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = 'items'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );

-- Admin bootstrap (run once; set password in Auth dashboard separately):
-- update public.profiles set role = 'admin', seller_approved = true where username = 'sorktl12';

notify pgrst, 'reload schema';
