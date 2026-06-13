-- ═══════════════════════════════════════════════════════════════════════
-- Daily Sales — Individual Platform Breakdown Columns
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.daily_sales
  ADD COLUMN IF NOT EXISTS opening_cash        numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS card_sales          numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upi_sales           numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zomato_gold_sales   numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS zomato_sales        numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS swiggy_sales        numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS swiggy_dineout_sales numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eazy_diner_sales    numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_balance     numeric NOT NULL DEFAULT 0;

-- Existing online_sales = card + upi (sum kept for backward compat)
-- Existing aggregator_sales = all 5 aggregators (sum kept for backward compat)
