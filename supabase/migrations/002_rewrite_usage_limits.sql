-- Server-authoritative safety limits for OpenAI-backed rewrite requests.
--
-- The client still owns the product-level free/pro experience. This table is a
-- hard backend guardrail that prevents a modified client or leaked public key
-- from generating unbounded model costs.

create table if not exists rewrite_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table rewrite_daily_usage enable row level security;

-- No client policies are intentionally defined. Only the service-role-backed
-- Edge Function can read or mutate usage records.

create or replace function consume_rewrite_safety_quota(
  p_user_id uuid,
  p_daily_limit integer
)
returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_user_id is null or p_daily_limit < 1 then
    raise exception 'Invalid quota arguments';
  end if;

  insert into rewrite_daily_usage (user_id, usage_date, request_count, updated_at)
  values (p_user_id, (now() at time zone 'utc')::date, 1, now())
  on conflict (user_id, usage_date)
  do update
    set request_count = rewrite_daily_usage.request_count + 1,
        updated_at = now()
    where rewrite_daily_usage.request_count < p_daily_limit
  returning request_count into current_count;

  if current_count is not null then
    return query select true, current_count;
    return;
  end if;

  select request_count
    into current_count
    from rewrite_daily_usage
   where user_id = p_user_id
     and usage_date = (now() at time zone 'utc')::date;

  return query select false, coalesce(current_count, p_daily_limit);
end;
$$;

revoke all on function consume_rewrite_safety_quota(uuid, integer) from public;
revoke all on function consume_rewrite_safety_quota(uuid, integer) from anon;
revoke all on function consume_rewrite_safety_quota(uuid, integer) from authenticated;
grant execute on function consume_rewrite_safety_quota(uuid, integer) to service_role;
