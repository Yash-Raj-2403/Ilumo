-- ILUMO database schema.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is safe to run again (uses IF NOT EXISTS / drops policies before recreating).

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('student', 'parent')),
  child jsonb,       -- parents: { name, age, needs[] }
  settings jsonb,    -- accessibility settings
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content jsonb not null,   -- the structured lesson (sections, quiz, ...)
  source text not null check (source in ('gemini', 'mock')),
  visual jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lessons_owner_idx on public.lessons (owner_id, created_at desc);

create table if not exists public.lesson_progress (
  owner_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  sections_read int[] not null default '{}',
  quiz jsonb,               -- { answers[], feedback }
  updated_at timestamptz not null default now(),
  primary key (owner_id, lesson_id)
);

-- Row Level Security: everyone can only touch their own rows.
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- Profiles are created by the server (service role) at signup, so no insert policy.

drop policy if exists "lessons: own" on public.lessons;
create policy "lessons: own" on public.lessons for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "progress: own" on public.lesson_progress;
create policy "progress: own" on public.lesson_progress for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
