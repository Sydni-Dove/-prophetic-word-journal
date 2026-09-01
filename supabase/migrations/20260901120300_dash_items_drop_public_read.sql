-- Revert to private. The dashboard's passphrase gate now signs in as the
-- owner (Supabase session), which authorizes both reads and writes through
-- the owner-scoped policies. Public/anon access is no longer used.
drop policy if exists dash_items_anon_read on public.dash_items;
