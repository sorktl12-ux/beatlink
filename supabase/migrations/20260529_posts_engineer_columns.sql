-- Run in Supabase Dashboard → SQL Editor → New query
-- Fixes: "Could not find the 'engineer_mix_scope' column of 'posts' in the schema cache"

alter table public.posts add column if not exists recruit_count integer;
alter table public.posts add column if not exists engineer_pay_krw integer;
alter table public.posts add column if not exists engineer_mix_scope text;

-- Refresh PostgREST schema cache (usually automatic within ~1 min; this nudges it)
notify pgrst, 'reload schema';
