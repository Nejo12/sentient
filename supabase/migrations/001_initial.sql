-- Sentient initial schema: rewrites history + user settings

create table if not exists rewrites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  contact_name text,
  source_app text,
  intent text not null check (intent in ('do', 'missing')),
  understanding text,
  snippet text not null,
  full_text text not null,
  created_at timestamptz default now()
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_understanding text default 'calm',
  edit_before_send boolean default true,
  save_history boolean default true
);

alter table rewrites enable row level security;

create policy "Users read own rewrites"
  on rewrites for select
  using (auth.uid() = user_id);

create policy "Users insert own rewrites"
  on rewrites for insert
  with check (auth.uid() = user_id);

alter table user_settings enable row level security;

create policy "Users read own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users update own settings"
  on user_settings for update
  using (auth.uid() = user_id);
