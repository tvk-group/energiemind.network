-- EnergieMIND Network — Partner Application submissions
-- Run in Supabase SQL Editor (safe to re-run)

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

-- Table-level grants (required — RLS alone is not enough)
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.partner_applications to service_role;
grant insert on public.partner_applications to anon, authenticated;

-- Drop existing policies if re-running
drop policy if exists "Allow public insert" on public.partner_applications;
drop policy if exists "No public read" on public.partner_applications;

-- Allow anonymous inserts from the public website
create policy "Allow public insert"
  on public.partner_applications
  for insert
  to anon, authenticated
  with check (true);

-- Block public reads (admin uses service role)
create policy "No public read"
  on public.partner_applications
  for select
  to anon, authenticated
  using (false);

create index if not exists partner_applications_created_at_idx
  on public.partner_applications (created_at desc);

create index if not exists partner_applications_status_idx
  on public.partner_applications (status);
