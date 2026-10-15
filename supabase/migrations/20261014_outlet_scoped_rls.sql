-- ── Outlet-scoped row security on the daily records ──────────────────────────
--
-- The app now resolves an outlet per screen and staff can no longer pick
-- another branch through ?outlet=. That is application-layer only: the
-- database still lets any signed-in employee read every row. The existing
-- policies are written as
--
--     for select using (auth.uid() is not null)
--
-- so anyone holding the anon key and a staff login can query the other
-- branch's sales, checklists and cash outs directly, bypassing the app.
--
-- WHY RESTRICTIVE POLICIES: Postgres ORs permissive policies together, so
-- adding another permissive one cannot take access away, and some of these
-- tables carry policies created by hand in the dashboard that are not in this
-- repo. A RESTRICTIVE policy is ANDed with every permissive policy instead, so
-- this constrains all existing and future grants to the viewer's own outlet
-- without having to enumerate — or risk breaking — what is already there.
--
-- The service role bypasses RLS, so owner screens that read through the admin
-- client are unaffected.

-- ── Helpers ──────────────────────────────────────────────────────────────────

-- The caller's own outlet. Staff with no outlet set fall back to Saheed Nagar,
-- matching the app (profile.outlet_id ?? DEFAULT_OUTLET_ID) so an unassigned
-- account keeps seeing the original branch rather than nothing at all.
create or replace function public.my_outlet_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select outlet_id from public.profiles where id = auth.uid() and is_active = true),
    'e840db26-9c52-4212-a484-2b41175646f0'::uuid
  );
$$;

-- May the caller touch a row belonging to this outlet? The owner may see every
-- branch, and so may the head chef, who runs the kitchen across both rather
-- than sitting at one. Everyone else is limited to their own outlet.
-- Mirrors canViewAllOutlets() in lib/data/outlets.ts — keep the two in step.
create or replace function public.can_see_outlet(target uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_owner()
      or public.is_head_chef()
      or target is null
      or target = public.my_outlet_id();
$$;

grant execute on function public.my_outlet_id() to authenticated;
grant execute on function public.can_see_outlet(uuid) to authenticated;

-- ── Restrictive scope, one per table ─────────────────────────────────────────
-- `for all` covers select, insert, update and delete. USING filters the rows a
-- statement may read or change; WITH CHECK stops a row being written onto
-- another branch.

drop policy if exists opening_checklists_outlet_scope on public.opening_checklists;
create policy opening_checklists_outlet_scope on public.opening_checklists
  as restrictive for all to authenticated
  using (public.can_see_outlet(outlet_id))
  with check (public.can_see_outlet(outlet_id));

drop policy if exists closing_checklists_outlet_scope on public.closing_checklists;
create policy closing_checklists_outlet_scope on public.closing_checklists
  as restrictive for all to authenticated
  using (public.can_see_outlet(outlet_id))
  with check (public.can_see_outlet(outlet_id));

drop policy if exists daily_sales_outlet_scope on public.daily_sales;
create policy daily_sales_outlet_scope on public.daily_sales
  as restrictive for all to authenticated
  using (public.can_see_outlet(outlet_id))
  with check (public.can_see_outlet(outlet_id));

drop policy if exists cash_expenses_outlet_scope on public.cash_expenses;
create policy cash_expenses_outlet_scope on public.cash_expenses
  as restrictive for all to authenticated
  using (public.can_see_outlet(outlet_id))
  with check (public.can_see_outlet(outlet_id));

-- ── Verification ─────────────────────────────────────────────────────────────
-- List what is now in force (the scope rows should show permissive = false):
--   select tablename, policyname, permissive, cmd
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('opening_checklists','closing_checklists','daily_sales','cash_expenses')
--   order by tablename, policyname;
--
-- Sanity-check the helpers as a staff user (should return their own outlet,
-- true for it, false for the other):
--   select public.my_outlet_id(), public.can_see_outlet(public.my_outlet_id());
