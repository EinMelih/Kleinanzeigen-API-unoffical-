create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  display_name text,
  status text not null default 'active' check (status in ('active', 'paused', 'disabled')),
  timezone text not null default 'Europe/Berlin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  is_enabled boolean not null default true,
  send_mode text not null default 'manual_review' check (send_mode in ('manual_review', 'auto_send', 'disabled')),
  max_fake_score integer not null default 45 check (max_fake_score between 0 and 100),
  min_deal_score integer not null default 60 check (min_deal_score between 0 and 100),
  max_budget numeric(12,2),
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_criteria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  bot_id uuid references public.user_bots(id) on delete set null,
  name text not null,
  category text,
  min_price numeric(12,2),
  max_price numeric(12,2),
  price_type text default 'any' check (price_type in ('any', 'fixed', 'negotiable')),
  radius_km integer,
  keywords_include text[] not null default '{}',
  keywords_exclude text[] not null default '{}',
  condition_keywords text[] not null default '{}',
  brand text,
  model text,
  is_enabled boolean not null default true,
  require_manual_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  platform text not null default 'kleinanzeigen',
  platform_seller_id text,
  seller_name text,
  profile_url text,
  profile_age_days integer,
  rating_count integer,
  is_verified boolean not null default false,
  response_rate numeric(5,2),
  active_listing_count integer,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, platform_seller_id)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  search_criteria_id uuid references public.search_criteria(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null,
  platform text not null default 'kleinanzeigen',
  platform_listing_id text not null,
  title text not null,
  description text,
  category text,
  condition_text text,
  brand text,
  model text,
  listing_url text not null,
  location_text text,
  distance_km numeric(8,2),
  price_amount numeric(12,2),
  price_type text not null default 'unknown' check (price_type in ('fixed', 'negotiable', 'unknown')),
  currency text not null default 'EUR',
  estimated_market_value numeric(12,2),
  scraped_at timestamptz not null default now(),
  listing_created_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'matched', 'rejected', 'messaged', 'bought', 'archived')),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, platform_listing_id)
);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  image_hash text,
  is_reused boolean not null default false,
  clarity_score numeric(5,4),
  position_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.price_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  budget_fit boolean not null default false,
  below_market boolean not null default false,
  negotiation_potential boolean not null default false,
  deal_score integer not null check (deal_score between 0 and 100),
  estimated_market_value numeric(12,2),
  suggested_offer_price numeric(12,2),
  notes jsonb not null default '[]'::jsonb,
  model_name text default 'heuristic_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fake_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  fake_score integer not null check (fake_score between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  reasons jsonb not null default '[]'::jsonb,
  flags jsonb not null default '[]'::jsonb,
  model_name text default 'heuristic_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  seller_id uuid references public.sellers(id) on delete set null,
  tone text not null default 'friendly' check (tone in ('friendly', 'direct', 'careful')),
  body_text text not null,
  contains_pickup boolean not null default false,
  contains_paypal boolean not null default false,
  personalized_with_seller boolean not null default false,
  source text not null default 'template' check (source in ('template', 'ai', 'manual')),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  seller_id uuid references public.sellers(id) on delete set null,
  generated_message_id uuid references public.generated_messages(id) on delete set null,
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  delivery_mode text not null default 'manual' check (delivery_mode in ('manual', 'auto_send', 'simulation')),
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'failed', 'received')),
  body_text text not null,
  platform_conversation_id text,
  platform_message_id text,
  sent_at timestamptz,
  received_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  bot_id uuid references public.user_bots(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  action_type text not null,
  action_status text not null default 'completed' check (action_status in ('queued', 'completed', 'failed', 'blocked')),
  action_reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  channel_type text not null check (channel_type in ('telegram', 'email', 'webhook')),
  is_enabled boolean not null default false,
  destination text,
  secret_token text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  channel_id uuid references public.notification_channels(id) on delete set null,
  event_type text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'ignored')),
  title text,
  body_text text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  job_type text not null check (job_type in ('price_analysis', 'fake_analysis', 'message_generation')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  provider text,
  model_name text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_search_criteria_user_enabled
  on public.search_criteria (user_id, is_enabled);

create index if not exists idx_listings_user_status
  on public.listings (user_id, status, first_seen_at desc);

create index if not exists idx_listings_search_criteria
  on public.listings (search_criteria_id, first_seen_at desc);

create index if not exists idx_messages_user_status
  on public.messages (user_id, status, created_at desc);

create index if not exists idx_bot_actions_user_created
  on public.bot_actions (user_id, created_at desc);

create index if not exists idx_notification_events_user_created
  on public.notification_events (user_id, created_at desc);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_bots_updated_at on public.user_bots;
create trigger trg_user_bots_updated_at
before update on public.user_bots
for each row execute function public.set_updated_at();

drop trigger if exists trg_search_criteria_updated_at on public.search_criteria;
create trigger trg_search_criteria_updated_at
before update on public.search_criteria
for each row execute function public.set_updated_at();

drop trigger if exists trg_sellers_updated_at on public.sellers;
create trigger trg_sellers_updated_at
before update on public.sellers
for each row execute function public.set_updated_at();

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

drop trigger if exists trg_price_analysis_updated_at on public.price_analysis;
create trigger trg_price_analysis_updated_at
before update on public.price_analysis
for each row execute function public.set_updated_at();

drop trigger if exists trg_fake_analysis_updated_at on public.fake_analysis;
create trigger trg_fake_analysis_updated_at
before update on public.fake_analysis
for each row execute function public.set_updated_at();

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

drop trigger if exists trg_notification_channels_updated_at on public.notification_channels;
create trigger trg_notification_channels_updated_at
before update on public.notification_channels
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_jobs_updated_at on public.ai_jobs;
create trigger trg_ai_jobs_updated_at
before update on public.ai_jobs
for each row execute function public.set_updated_at();
