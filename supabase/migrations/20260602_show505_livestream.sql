-- 505: live stream (replaces track upload workflow)

alter table public.show505_config add column if not exists stream_url text;
alter table public.show505_config add column if not exists stream_live boolean not null default false;

notify pgrst, 'reload schema';
