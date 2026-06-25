-- EnergieMIND Network — Partner Application submissions
-- Run in Supabase SQL Editor

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  organization text not null,
  email text not null,
  phone text,
  country text not null,
  site_type text not null,
  capacity text,
  message text not null,
  language text default 'en',
  source text default 'energiemind.network',
  status text default 'new' check (status in ('new', 'reviewing', 'approved', 'declined'))
);

alter table public.partner_applications enable row level security;

-- Allow anonymous inserts from the public website (anon key)
create policy "Allow public insert"
  on public.partner_applications
  for insert
  to anon
  with check (true);

-- Restrict reads to authenticated service role / dashboard users only
create policy "No public read"
  on public.partner_applications
  for select
  to anon
  using (false);

create index if not exists partner_applications_created_at_idx
  on public.partner_applications (created_at desc);

create index if not exists partner_applications_status_idx
  on public.partner_applications (status);
