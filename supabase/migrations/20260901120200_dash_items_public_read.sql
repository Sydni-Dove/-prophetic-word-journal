-- Personal single-tenant dashboard: allow public (no-login) READ of the
-- inventory so /dashboard loads without a sign-in. Writes remain locked to
-- the owner (no anon insert/update/delete), so the public can view the data
-- but never alter it. Drop this policy to make the dashboard private again.
create policy dash_items_anon_read on public.dash_items
  for select to anon using (true);
