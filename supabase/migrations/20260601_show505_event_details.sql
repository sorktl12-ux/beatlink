-- 505 event details: venue + show time

alter table public.show505_config add column if not exists event_venue text;
alter table public.show505_config add column if not exists event_starts_at timestamptz;

update public.show505_config
set
  event_note = 'Sinchon Geek Live House · Tue Jun 2, 2026 · 6:00 PM',
  event_venue = 'Sinchon Geek Live House',
  event_starts_at = '2026-06-02T18:00:00+09'::timestamptz,
  updated_at = now()
where id = 1;

notify pgrst, 'reload schema';
