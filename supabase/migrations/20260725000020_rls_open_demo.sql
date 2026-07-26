-- 20260725000020_rls_open_demo.sql
-- No-auth demo: RLS enabled everywhere (explicit + auditable > silent
-- disable). Reads open to anon on all 8 tables. Writes acotadas to the
-- 2 real advisor gestures the front performs (drag stage, add note) --
-- everything else goes through service_role (backend, bypasses RLS).
alter table public.contacts           enable row level security;
alter table public.opportunities      enable row level security;
alter table public.insurance_products enable row level security;
alter table public.supplier_routes    enable row level security;
alter table public.quote_requests     enable row level security;
alter table public.notes              enable row level security;
alter table public.tasks              enable row level security;
alter table public.timeline_events    enable row level security;

-- Supabase's local role bootstrap (roles.sql) grants FULL table privileges
-- (arwdDxtm) to anon/authenticated at table-creation time -- the same footgun
-- documented for SECURITY DEFINER EXECUTE grants ("revoke from public does NOT
-- lock out anon/authenticated"). A column-level GRANT (below, `update (stage)`)
-- does NOT narrow an existing table-level UPDATE grant -- it only ADDS. So the
-- broad default must be revoked FIRST, or anon can write any column despite the
-- narrow grant looking correct. Verified live: without this revoke, an anon
-- PATCH of `name` alone (no `stage` in the body) succeeded silently (204).
revoke all on public.contacts           from anon;
revoke all on public.opportunities      from anon;
revoke all on public.insurance_products from anon;
revoke all on public.supplier_routes    from anon;
revoke all on public.quote_requests     from anon;
revoke all on public.notes              from anon;
revoke all on public.tasks              from anon;
revoke all on public.timeline_events    from anon;

-- READ: open to anon on all 8 (kanban + timeline).
create policy read_all on public.contacts           for select to anon using (true);
create policy read_all on public.opportunities       for select to anon using (true);
create policy read_all on public.insurance_products  for select to anon using (true);
create policy read_all on public.supplier_routes     for select to anon using (true);
create policy read_all on public.quote_requests      for select to anon using (true);
create policy read_all on public.notes               for select to anon using (true);
create policy read_all on public.tasks               for select to anon using (true);
create policy read_all on public.timeline_events     for select to anon using (true);

grant select on all tables in schema public to anon;

-- WRITE: acotada to the real advisor gesture in the demo.
--   drag a card = UPDATE only the stage column:
grant update (stage) on public.opportunities to anon;
create policy advisor_move_stage on public.opportunities
  for update to anon using (true) with check (true);

--   add a note from the front:
grant insert on public.notes to anon;
create policy advisor_add_note on public.notes
  for insert to anon with check (true);

-- No delete for anon. Everything else (contacts, other opportunity columns,
-- tasks, quote_requests, supplier_routes, insurance_products, timeline_events
-- writes) is service_role only -- it bypasses RLS and was never granted here.
