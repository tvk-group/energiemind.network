-- Run this in Supabase SQL Editor if the partner form shows errors
-- Fixes: permission denied for table partner_applications

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on public.partner_applications to service_role;
grant insert on public.partner_applications to anon, authenticated;

drop policy if exists "Allow public insert" on public.partner_applications;
create policy "Allow public insert"
  on public.partner_applications
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "No public read" on public.partner_applications;
create policy "No public read"
  on public.partner_applications
  for select
  to anon, authenticated
  using (false);
