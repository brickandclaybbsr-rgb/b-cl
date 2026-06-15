-- ══════════════════════════════════════════════════════════════════════════
-- Fix 1: Add team column + composite unique index to checklists
-- (was written 2026-06-14 but never applied to Supabase)
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.opening_checklists
  ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'all';

ALTER TABLE public.opening_checklists
  DROP CONSTRAINT IF EXISTS opening_checklists_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS opening_checklists_date_team_key
  ON public.opening_checklists (date, team);

ALTER TABLE public.closing_checklists
  ADD COLUMN IF NOT EXISTS team text NOT NULL DEFAULT 'all';

ALTER TABLE public.closing_checklists
  DROP CONSTRAINT IF EXISTS closing_checklists_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS closing_checklists_date_team_key
  ON public.closing_checklists (date, team);

-- ══════════════════════════════════════════════════════════════════════════
-- Fix 2: sales_select RLS was too restrictive — staff could only read rows
-- they personally submitted, so the "already submitted by X" screen never
-- appeared and staff kept seeing a blank form (then hitting duplicate errors).
-- Match the same open-read policy used for checklists.
-- ══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS sales_select ON public.daily_sales;
CREATE POLICY sales_select ON public.daily_sales
  FOR SELECT USING (auth.uid() IS NOT NULL);
