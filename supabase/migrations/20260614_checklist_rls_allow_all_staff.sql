-- Allow any authenticated user to read opening/closing checklists.
-- The previous policy (submitted_by = auth.uid() or is_owner()) blocked
-- head chef and teammates from reading each other's submissions.

drop policy if exists opening_select on public.opening_checklists;
create policy opening_select on public.opening_checklists
  for select using (auth.uid() is not null);

drop policy if exists closing_select on public.closing_checklists;
create policy closing_select on public.closing_checklists
  for select using (auth.uid() is not null);
