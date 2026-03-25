begin;

create or replace function public.consume_ai_credit(user_id_param uuid)
returns table (
  allowed boolean,
  used_credits integer,
  credit_limit integer,
  plan_tier text,
  counted boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text := 'free';
  current_limit integer := 5;
  current_used integer := 0;
  current_reset_at timestamptz;
  current_ts timestamptz := now();
  today_utc date := (current_ts at time zone 'UTC')::date;
begin
  select coalesce(us.plan_tier, 'free')
  into current_plan
  from public.user_subscriptions us
  where us.user_id = user_id_param
  limit 1;

  current_plan := coalesce(current_plan, 'free');

  if current_plan = 'pro' then
    return query
    select true, 0, 100, current_plan, false;
    return;
  end if;

  insert into public.user_api_usage (user_id, ai_credits_used, last_reset_at)
  values (user_id_param, 0, current_ts)
  on conflict (user_id) do nothing;

  select u.ai_credits_used, u.last_reset_at
  into current_used, current_reset_at
  from public.user_api_usage u
  where u.user_id = user_id_param
  for update;

  if current_reset_at is null or (current_reset_at at time zone 'UTC')::date <> today_utc then
    current_used := 0;

    update public.user_api_usage
    set ai_credits_used = 0,
        last_reset_at = current_ts
    where user_id = user_id_param;
  else
    current_used := coalesce(current_used, 0);
  end if;

  if current_used >= current_limit then
    return query
    select false, current_used, current_limit, current_plan, false;
    return;
  end if;

  current_used := current_used + 1;

  update public.user_api_usage
  set ai_credits_used = current_used,
      last_reset_at = current_ts
  where user_id = user_id_param;

  return query
  select true, current_used, current_limit, current_plan, true;
end;
$$;

create or replace function public.refund_ai_credit(user_id_param uuid)
returns table (
  used_credits integer,
  credit_limit integer,
  plan_tier text,
  refunded boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text := 'free';
  current_limit integer := 5;
  current_used integer := 0;
  current_reset_at timestamptz;
  current_ts timestamptz := now();
  today_utc date := (current_ts at time zone 'UTC')::date;
begin
  select coalesce(us.plan_tier, 'free')
  into current_plan
  from public.user_subscriptions us
  where us.user_id = user_id_param
  limit 1;

  current_plan := coalesce(current_plan, 'free');

  if current_plan = 'pro' then
    return query
    select 0, 100, current_plan, false;
    return;
  end if;

  select u.ai_credits_used, u.last_reset_at
  into current_used, current_reset_at
  from public.user_api_usage u
  where u.user_id = user_id_param
  for update;

  if not found then
    return query
    select 0, current_limit, current_plan, false;
    return;
  end if;

  if current_reset_at is null or (current_reset_at at time zone 'UTC')::date <> today_utc then
    update public.user_api_usage
    set ai_credits_used = 0,
        last_reset_at = current_ts
    where user_id = user_id_param;

    return query
    select 0, current_limit, current_plan, false;
    return;
  end if;

  current_used := greatest(coalesce(current_used, 0) - 1, 0);

  update public.user_api_usage
  set ai_credits_used = current_used,
      last_reset_at = current_ts
  where user_id = user_id_param;

  return query
  select current_used, current_limit, current_plan, true;
end;
$$;

grant execute on function public.consume_ai_credit(uuid) to service_role;
grant execute on function public.refund_ai_credit(uuid) to service_role;

commit;
