-- ── Allow owner to UPDATE staff_documents ─────────────────────────────────────
-- staff_documents had SELECT/INSERT/DELETE policies but no UPDATE policy, so with
-- RLS enabled every UPDATE silently affected 0 rows (no error). That broke
-- finalizePayslip (file_name / is_visible_to_staff / payment_* never persisted)
-- and togglePayslipVisibility. This grants the owner UPDATE rights.

drop policy if exists staff_documents_update on public.staff_documents;
create policy staff_documents_update on public.staff_documents
  for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());
