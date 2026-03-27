begin;

alter table public.profiles
  add column if not exists pro_waitlist_joined_at timestamptz;

commit;
