-- 505 공연준비: event-gated backing tracks + cue sheets (admin upload only)

create table if not exists public.show505_config (
  id int primary key default 1 check (id = 1),
  is_active boolean not null default false,
  event_title text not null default '505',
  event_note text default '',
  updated_at timestamptz not null default now()
);

insert into public.show505_config (id, is_active, event_title)
values (1, false, '505')
on conflict (id) do nothing;

create table if not exists public.show505_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  cue_sheet_md text default '',
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.show505_tracks (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.show505_sets (id) on delete cascade,
  title text not null,
  audio_path text not null,
  duration_sec numeric,
  sort_order integer not null default 0,
  cues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists show505_tracks_set_order on public.show505_tracks (set_id, sort_order);

alter table public.show505_config enable row level security;
alter table public.show505_sets enable row level security;
alter table public.show505_tracks enable row level security;

drop policy if exists "show505_config_select" on public.show505_config;
create policy "show505_config_select" on public.show505_config for select
  using (is_active or public.is_admin());

drop policy if exists "show505_config_update" on public.show505_config;
create policy "show505_config_update" on public.show505_config for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "show505_sets_select" on public.show505_sets;
create policy "show505_sets_select" on public.show505_sets for select
  using (
    public.is_admin()
    or (
      is_published
      and exists (select 1 from public.show505_config where id = 1 and is_active)
    )
  );

drop policy if exists "show505_sets_write" on public.show505_sets;
create policy "show505_sets_write" on public.show505_sets for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "show505_tracks_select" on public.show505_tracks;
create policy "show505_tracks_select" on public.show505_tracks for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.show505_sets s
      join public.show505_config c on c.id = 1
      where s.id = set_id and s.is_published and c.is_active
    )
  );

drop policy if exists "show505_tracks_write" on public.show505_tracks;
create policy "show505_tracks_write" on public.show505_tracks for all
  using (public.is_admin()) with check (public.is_admin());

-- Admin upload path: audio/505/{set_id}/...
drop policy if exists "audio_write" on storage.objects;
create policy "audio_write" on storage.objects for all to authenticated
  using (
    bucket_id = 'audio'
    and (
      public.is_admin()
      or (
        (storage.foldername(name))[1] = 'posts'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
      or (
        (storage.foldername(name))[1] = '505'
        and public.is_admin()
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
      or (
        (storage.foldername(name))[1] = '505'
        and public.is_admin()
      )
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.show505_config;
exception when others then null;
end $$;

notify pgrst, 'reload schema';
