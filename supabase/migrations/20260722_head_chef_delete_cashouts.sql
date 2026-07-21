-- ── Head chef delete rights on cash-outs ──────────────────────────────────────
-- The owner (Pradosh) already has full delete via is_owner(). This grants the
-- head chef the same unrestricted delete on cash_expenses (cash-out records).

-- Helper: is the current user the (active) head chef?
create or replace function public.is_head_chef()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and team = 'head_chef' and is_active = true
  );
$$;

-- Widen the delete policy to owner OR head chef.
drop policy if exists "Owner can delete cash expenses" on public.cash_expenses;
drop policy if exists cash_expenses_delete on public.cash_expenses;
create policy cash_expenses_delete
  on public.cash_expenses for delete to authenticated
  using (public.is_owner() or public.is_head_chef());
