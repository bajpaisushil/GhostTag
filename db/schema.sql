-- GhostTag schema for self-hosted / raw Postgres (Postgres 14+).
--
-- Apply it with either:
--   psql "$DATABASE_URL" -f db/schema.sql
-- or let Docker Compose run it automatically on first boot (see docker-compose.yml).
--
-- No Row Level Security here: unlike the Supabase setup, the database is not
-- publicly reachable and the app connects as a normal owning role. Access
-- control is the app's auth + the network boundary, which is simpler and faster
-- at scale than per-row policy evaluation.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: one row per identity, deduped on (provider, provider_id).
-- ---------------------------------------------------------------------------
create table if not exists users (
  id               uuid primary key default gen_random_uuid(),
  provider         text not null check (provider in ('telegram', 'google')),
  provider_id      text not null,
  name             text,
  email            text,
  image            text,
  telegram_chat_id text,
  notify_email     text,
  created_at       timestamptz not null default now(),
  unique (provider, provider_id)
);

-- ---------------------------------------------------------------------------
-- tags: a printable QR. A user may own several (car, bike, spare).
-- ---------------------------------------------------------------------------
create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  token      text not null unique,            -- public, unguessable slug in /t/<token>
  user_id    uuid not null references users (id) on delete cascade,
  label      text not null default 'My car',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists tags_user_id_idx on tags (user_id);

-- ---------------------------------------------------------------------------
-- pings: one row per "please move" tap. High-churn table — this is what grows
-- fastest at 1M+ users, so it is indexed for the cooldown probe and is meant to
-- be retention-trimmed (see the cleanup statement at the bottom / cron note).
-- We never store who scanned, only a salted one-way hash of their IP.
-- ---------------------------------------------------------------------------
create table if not exists pings (
  id         uuid primary key default gen_random_uuid(),
  tag_id     uuid not null references tags (id) on delete cascade,
  ip_hash    text,
  delivered  boolean not null default false,
  channel    text,
  created_at timestamptz not null default now()
);

-- Composite index that exactly serves the cooldown EXISTS check
-- (WHERE tag_id = $1 AND ip_hash = $2 AND created_at >= now() - interval).
create index if not exists pings_cooldown_idx on pings (tag_id, ip_hash, created_at desc);

-- For showing an owner their tag's recent activity.
create index if not exists pings_tag_recent_idx on pings (tag_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Retention at scale: the cooldown only looks back 15 minutes, so old pings are
-- dead weight. Run this on a schedule (cron / pg_cron) to keep the table small.
-- Keeping ~7 days leaves room for "recent activity" views.
-- ---------------------------------------------------------------------------
-- delete from pings where created_at < now() - interval '7 days';
