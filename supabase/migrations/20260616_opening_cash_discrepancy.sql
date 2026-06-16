-- Add cash discrepancy tracking to opening checklists
ALTER TABLE public.opening_checklists
  ADD COLUMN IF NOT EXISTS cash_discrepancy numeric,           -- positive = excess, negative = shortage
  ADD COLUMN IF NOT EXISTS cash_discrepancy_reason text;
