-- BEATLINK — Supabase schema (production)
-- Run this whole file in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to re-run: uses "if not exists" / "drop policy if exists", so it won't wipe data.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  full_name   text,                                  -- real name (Korean), required at signup
  phone       text,                                  -- contact phone, required at signup
  role        text not null default 'player',
  credits     integer not null default 0,
  created_at  timestamptz not null default now()
);

-- For projects created before these columns existed:
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;

create table if not exists public.posts (
  id                  uuid primary key default gen_random_uuid(),
  board               text not null,                 -- 'player' | 'producer' | 'engineer'
  author_id           uuid not null references public.profiles (id) on delete cascade,
  author_name         text not null,
  title               text not null,
  description         text default '',
  audio_url           text,
  audio_path          text,
  status              text not null default 'pending', -- pending|approved|rejected|completed
  deal_requester_id   uuid,
  deal_requester_name text,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

alter table public.posts add column if not exists recruit_count integer;

create table if not exists public.requests (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,
  requester_id  uuid not null,
  requester_name text not null,
  message       text default '',
  status        text not null default 'pending',     -- pending | accepted
  created_at    timestamptz not null default now(),
  unique (post_id, requester_id)
);

create table if not exists public.beats (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  audio_url   text,
  audio_path  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  beat_id     uuid not null references public.beats (id) on delete cascade,
  beat_title  text not null,
  audio_url   text,
  buyer_id    uuid not null,
  created_at  timestamptz not null default now(),
  unique (buyer_id, beat_id)
);

-- Marketplace: only members approved by the admin (seller_approved) can post items
alter table public.profiles add column if not exists seller_approved boolean not null default false;

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.profiles (id) on delete cascade,
  seller_name text not null,
  title       text not null,
  description text default '',
  price       integer not null default 0,
  image_url   text,
  image_path  text,
  status      text not null default 'available',   -- available | sold
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RPCs (atomic operations) — SECURITY DEFINER so they bypass RLS safely
-- ---------------------------------------------------------------------------

-- Close a deal: accept one requester, grant +2 credits to both sides.
-- Player/producer posts with recruit_count > 1 stay open until all slots are filled;
-- applications (requests) are never capped — only greenlights count toward recruit_count.
create or replace function public.close_deal(
  p_post_id uuid,
  p_requester_id uuid,
  p_requester_name text
) returns void
language plpgsql
security definer
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

  update public.profiles set credits = credits + 2 where id = v_author;
  update public.profiles set credits = credits + 2 where id = p_requester_id;

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

-- Buy a beat: deduct 10 credits from the buyer and record the purchase.
create or replace function public.buy_beat(
  p_beat_id uuid,
  p_buyer_id uuid
) returns void
language plpgsql
security definer
as $$
declare
  v_credits integer;
  v_title text;
  v_url text;
begin
  if exists (select 1 from public.purchases where buyer_id = p_buyer_id and beat_id = p_beat_id) then
    raise exception 'You already own this beat.';
  end if;

  select credits into v_credits from public.profiles where id = p_buyer_id for update;
  if v_credits is null or v_credits < 10 then
    raise exception 'Not enough credits.';
  end if;

  select title, audio_url into v_title, v_url from public.beats where id = p_beat_id;

  update public.profiles set credits = credits - 10 where id = p_buyer_id;

  insert into public.purchases (beat_id, beat_title, audio_url, buyer_id)
  values (p_beat_id, v_title, v_url, p_buyer_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security (production policies)
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.posts     enable row level security;
alter table public.requests  enable row level security;
alter table public.beats     enable row level security;
alter table public.purchases enable row level security;
alter table public.items     enable row level security;

-- Helper functions (SECURITY DEFINER -> bypass RLS, so no recursion on profiles)
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

-- Remove the old permissive demo policy from every table
do $$
declare t text;
begin
  foreach t in array array['profiles','posts','requests','beats','purchases','items'] loop
    execute format('drop policy if exists "demo_all" on public.%I;', t);
  end loop;
end $$;

-- profiles: read your own (admin reads all); insert only your own row and you may
-- NOT self-grant approval/admin; updates & deletes are admin-only.
-- (credits are changed only by the SECURITY DEFINER RPCs below.)
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

-- posts: anyone can read; only approved members (or admin) can post as themselves;
-- only the author or admin can edit/delete.
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

-- requests: visible to the requester, the post author, and admin; create as yourself.
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

-- beats: anyone can read; only admin manages them.
drop policy if exists "beats_select" on public.beats;
create policy "beats_select" on public.beats for select using (true);

drop policy if exists "beats_modify" on public.beats;
create policy "beats_modify" on public.beats for all
  using (public.is_admin()) with check (public.is_admin());

-- purchases: you see your own (admin sees all); writes happen via the buy_beat RPC.
drop policy if exists "purchases_select" on public.purchases;
create policy "purchases_select" on public.purchases for select
  using (auth.uid() = buyer_id or public.is_admin());

drop policy if exists "purchases_modify" on public.purchases;
create policy "purchases_modify" on public.purchases for all
  using (public.is_admin()) with check (public.is_admin());

-- items (marketplace): anyone can read; only approved members (or admin) can list;
-- only the seller or admin can edit/delete.
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
-- Realtime (live updates like Firestore onSnapshot)
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['profiles','posts','requests','beats','purchases','items'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I;', t);
    exception when others then null; -- already added
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for audio (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

-- Public read for playback/preview; uploads & deletes require a logged-in user.
drop policy if exists "audio_read"  on storage.objects;
drop policy if exists "audio_write" on storage.objects;
create policy "audio_read"  on storage.objects for select using (bucket_id = 'audio');
create policy "audio_write" on storage.objects for all to authenticated
  using (bucket_id = 'audio') with check (bucket_id = 'audio');

drop policy if exists "images_read"  on storage.objects;
drop policy if exists "images_write" on storage.objects;
create policy "images_read"  on storage.objects for select using (bucket_id = 'images');
create policy "images_write" on storage.objects for all to authenticated
  using (bucket_id = 'images') with check (bucket_id = 'images');
