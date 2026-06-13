-- ═══════════════════════════════════════════════════════════════════════
-- Import cash-out entries from CLOSING BALANCE 2026.xlsx
-- All dates are June 2026. submitted_by = Biswajeet (front desk).
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  biswajit_id UUID;
BEGIN
  SELECT id INTO biswajit_id
  FROM profiles WHERE name ILIKE '%Biswaj%' LIMIT 1;

  IF biswajit_id IS NULL THEN
    RAISE EXCEPTION 'Biswajeet profile not found — check name spelling';
  END IF;

  INSERT INTO cash_expenses (date, person_name, amount, category, notes, submitted_by) VALUES

  -- ── 01 Jun ───────────────────────────────────────────────────────────
  ('2026-06-01', 'Milk',         116,  'expense',    NULL,                biswajit_id),
  ('2026-06-01', 'Nana',         100,  'withdrawal', NULL,                biswajit_id),
  ('2026-06-01', 'Duster',       200,  'expense',    NULL,                biswajit_id),
  ('2026-06-01', 'Mixture',       20,  'expense',    NULL,                biswajit_id),
  ('2026-06-01', 'John Sir',    2000,  'withdrawal', 'WDR',               biswajit_id),
  ('2026-06-01', 'Manoj',        200,  'advance',    NULL,                biswajit_id),

  -- ── 02 Jun ───────────────────────────────────────────────────────────
  ('2026-06-02', 'Milk',         232,  'expense',    NULL,                biswajit_id),
  ('2026-06-02', 'Mint',          15,  'expense',    NULL,                biswajit_id),
  ('2026-06-02', 'Manoj',        300,  'advance',    NULL,                biswajit_id),
  ('2026-06-02', 'Frozen Auto',  200,  'expense',    NULL,                biswajit_id),
  ('2026-06-02', 'File',         100,  'expense',    NULL,                biswajit_id),

  -- ── 03 Jun ───────────────────────────────────────────────────────────
  ('2026-06-03', 'Nana',         100,  'advance',    NULL,                biswajit_id),
  ('2026-06-03', 'Soda',         170,  'expense',    'Costing soda',      biswajit_id),
  ('2026-06-03', 'Egg',          200,  'expense',    NULL,                biswajit_id),
  ('2026-06-03', 'Electrical',   400,  'expense',    'Wear & plug',       biswajit_id),
  ('2026-06-03', 'Milk',         176,  'expense',    NULL,                biswajit_id),
  ('2026-06-03', 'Staff Fish',   340,  'expense',    NULL,                biswajit_id),

  -- ── 04 Jun ───────────────────────────────────────────────────────────
  ('2026-06-04', 'Frozen Auto',   60,  'expense',    NULL,                biswajit_id),

  -- ── 05 Jun ───────────────────────────────────────────────────────────
  ('2026-06-05', 'Milk',         232,  'expense',    NULL,                biswajit_id),
  ('2026-06-05', 'Egg',          200,  'expense',    NULL,                biswajit_id),
  ('2026-06-05', 'Straw',         50,  'expense',    NULL,                biswajit_id),
  ('2026-06-05', 'Satya Sir',   2500,  'withdrawal', 'Withdrawal',        biswajit_id),
  ('2026-06-05', 'Puja (Nana)',  700,  'withdrawal', NULL,                biswajit_id),
  ('2026-06-05', 'Bhagi (Nana)', 100,  'advance',    NULL,                biswajit_id),

  -- ── 06 Jun ───────────────────────────────────────────────────────────
  ('2026-06-06', 'Maida',        348,  'expense',    NULL,                biswajit_id),
  ('2026-06-06', 'Milk',         232,  'expense',    NULL,                biswajit_id),
  ('2026-06-06', 'John Sir',    2000,  'withdrawal', 'WDR',               biswajit_id),
  ('2026-06-06', 'Gita Apa',      60,  'expense',    'Ola auto fare',     biswajit_id),

  -- ── 07 Jun ───────────────────────────────────────────────────────────
  ('2026-06-07', 'Staff Chicken',360,  'expense',    NULL,                biswajit_id),
  ('2026-06-07', 'Egg',          200,  'expense',    NULL,                biswajit_id),
  ('2026-06-07', 'Milk',         232,  'expense',    NULL,                biswajit_id),
  ('2026-06-07', 'Maida',        350,  'expense',    NULL,                biswajit_id),
  ('2026-06-07', 'Bhagi (Nana)', 100,  'withdrawal', NULL,                biswajit_id),

  -- ── 08 Jun ───────────────────────────────────────────────────────────
  ('2026-06-08', 'Lemon',        200,  'expense',    NULL,                biswajit_id),
  ('2026-06-08', 'Paneer',       110,  'expense',    NULL,                biswajit_id),
  ('2026-06-08', 'Biswajeet Kandi', 2000, 'advance', 'Kandi advance',    biswajit_id),
  ('2026-06-08', 'John Sir',    1000,  'withdrawal', 'Withdrawal',        biswajit_id),

  -- ── 09 Jun ───────────────────────────────────────────────────────────
  ('2026-06-09', 'Vim Liquid',   170,  'expense',    NULL,                biswajit_id),
  ('2026-06-09', 'Milk',         116,  'expense',    NULL,                biswajit_id),
  ('2026-06-09', 'Bhagi (Nana)', 200,  'advance',    NULL,                biswajit_id),
  ('2026-06-09', 'John Sir',    1500,  'withdrawal', NULL,                biswajit_id),

  -- ── 10 Jun ───────────────────────────────────────────────────────────
  ('2026-06-10', 'Satya Sir',   3000,  'withdrawal', 'WDR',               biswajit_id),
  ('2026-06-10', 'Staff Fish',   250,  'expense',    NULL,                biswajit_id),

  -- ── 11 Jun ───────────────────────────────────────────────────────────
  ('2026-06-11', 'John Sir',    2500,  'withdrawal', 'WDR',               biswajit_id),
  ('2026-06-11', 'Paneer',       134,  'expense',    NULL,                biswajit_id),
  ('2026-06-11', 'Milk',         232,  'expense',    NULL,                biswajit_id),
  ('2026-06-11', 'Ola Auto',     100,  'expense',    NULL,                biswajit_id),

  -- ── 12 Jun ───────────────────────────────────────────────────────────
  ('2026-06-12', 'Mixture',       20,  'expense',    NULL,                biswajit_id),
  ('2026-06-12', 'Milk',         116,  'expense',    NULL,                biswajit_id),
  ('2026-06-12', 'Egg',          210,  'expense',    NULL,                biswajit_id),
  ('2026-06-12', 'Staff Rice',   100,  'expense',    NULL,                biswajit_id),
  ('2026-06-12', 'Vim',           20,  'expense',    NULL,                biswajit_id),
  ('2026-06-12', 'Grinder Repair',150, 'expense',    NULL,                biswajit_id),

  -- ── 13 Jun ───────────────────────────────────────────────────────────
  ('2026-06-13', 'Onion',         60,  'expense',    NULL,                biswajit_id),
  ('2026-06-13', 'Whole Jeera',   50,  'expense',    NULL,                biswajit_id);

  RAISE NOTICE 'Inserted % cash expense rows for Biswajeet (%)', 54, biswajit_id;
END $$;
