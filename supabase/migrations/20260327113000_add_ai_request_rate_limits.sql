begin;

create table if not exists public.user_ai_request_limits (
  user_id uuid primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  active_requests integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint user_ai_request_limits_request_count_check check (request_count >= 0),
  constraint user_ai_request_limits_active_requests_check check (active_requests >= 0)
);

alter table public.user_ai_request_limits enable row level security;

create or replace function public.reserve_ai_request_slot(user_id_param uuid)
returns table (
  allowed boolean,
  plan_tier text,
  reason text,
  retry_after_seconds integer,
  active_requests integer,
  concurrent_limit integer,
  request_count integer,
  burst_limit integer,
  window_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text := 'free';
  current_burst_limit integer := 3;
  current_concurrent_limit integer := 2;
  current_window_seconds integer := 15;
  stale_active_timeout_seconds integer := 90;
  current_active integer := 0;
  current_count integer := 0;
  current_window_started_at timestamptz := now();
  current_updated_at timestamptz := now();
  current_ts timestamptz := now();
  retry_seconds integer := 0;
begin
  select coalesce(us.plan_tier, 'free')
  into current_plan
  from public.user_subscriptions us
  where us.user_id = user_id_param
  limit 1;

  current_plan := coalesce(current_plan, 'free');
  current_burst_limit := case when current_plan = 'pro' then 8 else 3 end;

  insert into public.user_ai_request_limits (
    user_id,
    window_started_at,
    request_count,
    active_requests,
    updated_at
  )
  values (
    user_id_param,
    current_ts,
    0,
    0,
    current_ts
  )
  on conflict (user_id) do nothing;

  select
    u.window_started_at,
    u.request_count,
    u.active_requests,
    u.updated_at
  into
    current_window_started_at,
    current_count,
    current_active,
    current_updated_at
  from public.user_ai_request_limits u
  where u.user_id = user_id_param
  for update;

  current_count := coalesce(current_count, 0);
  current_active := coalesce(current_active, 0);
  current_window_started_at := coalesce(current_window_started_at, current_ts);
  current_updated_at := coalesce(current_updated_at, current_ts);

  if current_active > 0
    and extract(epoch from current_ts - current_updated_at) >= stale_active_timeout_seconds then
    current_active := 0;

    update public.user_ai_request_limits
    set active_requests = 0,
        updated_at = current_ts
    where user_id = user_id_param;
  end if;

  if extract(epoch from current_ts - current_window_started_at) >= current_window_seconds then
    current_count := 0;
    current_window_started_at := current_ts;

    update public.user_ai_request_limits
    set request_count = 0,
        window_started_at = current_ts,
        updated_at = current_ts
    where user_id = user_id_param;
  end if;

  if current_active >= current_concurrent_limit then
    return query
    select
      false,
      current_plan,
      'concurrent_limit',
      1,
      current_active,
      current_concurrent_limit,
      current_count,
      current_burst_limit,
      current_window_seconds;
    return;
  end if;

  if current_count >= current_burst_limit then
    retry_seconds := greatest(
      1,
      ceil(current_window_seconds - extract(epoch from current_ts - current_window_started_at))::integer
    );

    return query
    select
      false,
      current_plan,
      'rate_limit',
      retry_seconds,
      current_active,
      current_concurrent_limit,
      current_count,
      current_burst_limit,
      current_window_seconds;
    return;
  end if;

  current_active := current_active + 1;
  current_count := current_count + 1;

  update public.user_ai_request_limits
  set active_requests = current_active,
      request_count = current_count,
      window_started_at = current_window_started_at,
      updated_at = current_ts
  where user_id = user_id_param;

  return query
  select
    true,
    current_plan,
    'ok',
    0,
    current_active,
    current_concurrent_limit,
    current_count,
    current_burst_limit,
    current_window_seconds;
end;
$$;

create or replace function public.release_ai_request_slot(user_id_param uuid)
returns table (
  active_requests integer,
  released boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_active integer := 0;
  current_ts timestamptz := now();
begin
  select u.active_requests
  into current_active
  from public.user_ai_request_limits u
  where u.user_id = user_id_param
  for update;

  if not found then
    return query
    select 0, false;
    return;
  end if;

  current_active := greatest(coalesce(current_active, 0) - 1, 0);

  update public.user_ai_request_limits
  set active_requests = current_active,
      updated_at = current_ts
  where user_id = user_id_param;

  return query
  select current_active, true;
end;
$$;

grant execute on function public.reserve_ai_request_slot(uuid) to service_role;
grant execute on function public.release_ai_request_slot(uuid) to service_role;

commit;
