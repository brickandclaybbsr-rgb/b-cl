-- ── Head chef read access to all leave requests ───────────────────────────────
-- The head chef (Pradosh) may VIEW everyone's leave requests (read-only).
-- Approving/rejecting stays owner-only (leaves_update is unchanged).
-- Depends on public.is_head_chef() from 20260722_head_chef_delete_cashouts.sql.

drop policy if exists leaves_select on public.leaves;
create policy leaves_select on public.leaves
  for select using (
    profile_id = auth.uid()
    or public.is_owner()
    or public.is_head_chef()
  );
