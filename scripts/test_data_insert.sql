-- ═══════════════════════════════════════════════════════════════════════
-- TEST DATA — paste into Supabase SQL Editor, run, then test in the app
-- All test rows are tagged with '[TEST]' in notes for easy cleanup.
-- Run the CLEANUP section at the bottom when done.
-- ═══════════════════════════════════════════════════════════════════════

-- IST today (avoids UTC date mismatch)
DO $$
DECLARE
  ist_today DATE := (NOW() AT TIME ZONE 'Asia/Kolkata')::date;
  pradosh_id   UUID;
  biswajit_id  UUID;
  sandeep_id   UUID;
  ramahari_id  UUID;
  owner_id     UUID;
BEGIN

  SELECT id INTO pradosh_id   FROM profiles WHERE name ILIKE '%Pradosh%'   LIMIT 1;
  SELECT id INTO biswajit_id  FROM profiles WHERE name ILIKE '%Biswaj%'     LIMIT 1;
  SELECT id INTO sandeep_id   FROM profiles WHERE name ILIKE '%Sandeep%'    LIMIT 1;
  SELECT id INTO ramahari_id  FROM profiles WHERE name ILIKE '%Ramahari%'   LIMIT 1;
  SELECT id INTO owner_id     FROM profiles WHERE role = 'owner'             LIMIT 1;

  -- ── 1. OPENING CHECKLIST (Pradosh) ─────────────────────────────────────
  INSERT INTO opening_checklists (date, submitted_by, items, opening_cash, notes)
  VALUES (
    ist_today,
    pradosh_id,
    '[
      {"section":"Kitchen","label":"Gas burners checked","checked":true},
      {"section":"Kitchen","label":"Prep station clean and stocked","checked":true},
      {"section":"Kitchen","label":"Walk-in fridge temp verified","checked":true},
      {"section":"Front Desk","label":"POS system on and tested","checked":true},
      {"section":"Front Desk","label":"Reservation list reviewed","checked":true}
    ]'::jsonb,
    2500,
    '[TEST] Test submission — safe to delete'
  )
  ON CONFLICT (date) DO NOTHING;

  -- ── 2. CLOSING CHECKLIST (Biswajeet) ───────────────────────────────────
  INSERT INTO closing_checklists (date, submitted_by, items, closing_cash, cash_deposited, closing_stock_updated, notes)
  VALUES (
    ist_today,
    biswajit_id,
    '[
      {"section":"Front Desk","label":"Cash counted and matched","checked":true},
      {"section":"Front Desk","label":"POS closed and backed up","checked":true},
      {"section":"Kitchen","label":"Gas lines turned off","checked":true},
      {"section":"Kitchen","label":"Kitchen cleaned and locked","checked":true}
    ]'::jsonb,
    3200,
    3200,
    false,
    '[TEST] Test submission — safe to delete'
  )
  ON CONFLICT (date) DO NOTHING;

  -- ── 3. DAILY SALES (Biswajeet) ─────────────────────────────────────────
  INSERT INTO daily_sales (
    date, submitted_by,
    opening_cash,
    cash_sales, card_sales, upi_sales, online_sales,
    zomato_gold_sales, zomato_sales, swiggy_sales,
    swiggy_dineout_sales, eazy_diner_sales, aggregator_sales,
    closing_balance,
    discount_amount, complimentary_count, complimentary_value,
    notes
  )
  VALUES (
    ist_today, biswajit_id,
    2500,
    4200, 1800, 2100, 3900,
    1200, 3400, 2800,
    600, 400, 8400,
    5800,
    300, 2, 600,
    '[TEST] Test submission — safe to delete'
  )
  ON CONFLICT (date) DO NOTHING;

  -- ── 4. LEAVE REQUEST (Sandeep — CL next week) ──────────────────────────
  -- NOTE: Run the ALTER TABLE migration first if leave_type column is missing:
  -- ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS leave_type text CHECK (leave_type IN ('cl','sl','lwp'));
  INSERT INTO leaves (profile_id, leave_type, start_date, end_date, reason, status)
  VALUES (
    sandeep_id,
    'cl',
    ist_today + 4,
    ist_today + 5,
    '[TEST] Test leave request — safe to delete',
    'pending'
  );

  -- ── 5. REIMBURSEMENT (Ramahari) ─────────────────────────────────────────
  INSERT INTO reimbursements (submitted_by, amount, purpose, status, notes)
  VALUES (
    ramahari_id,
    450,
    'Grocery purchase for kitchen prep',
    'pending',
    '[TEST] Test reimbursement — safe to delete'
  );

  -- ── 6. ATTENDANCE PUNCHES (Sandeep — today, punch in + out) ────────────
  INSERT INTO attendance_punches (profile_id, pin, name, date, time, uploaded_by)
  SELECT
    sandeep_id,
    COALESCE(p.biometric_pin, 'TEST01'),
    p.name,
    ist_today,
    '09:07',
    owner_id
  FROM profiles p WHERE p.id = sandeep_id
  ON CONFLICT (profile_id, date, time) DO NOTHING;

  INSERT INTO attendance_punches (profile_id, pin, name, date, time, uploaded_by)
  SELECT
    sandeep_id,
    COALESCE(p.biometric_pin, 'TEST01'),
    p.name,
    ist_today,
    '22:48',
    owner_id
  FROM profiles p WHERE p.id = sandeep_id
  ON CONFLICT (profile_id, date, time) DO NOTHING;

  RAISE NOTICE 'Test data inserted for date: %', ist_today;
  RAISE NOTICE 'Pradosh=%  Biswajeet=%  Sandeep=%  Ramahari=%',
    pradosh_id, biswajit_id, sandeep_id, ramahari_id;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- CLEANUP — run this when you are done testing
-- ═══════════════════════════════════════════════════════════════════════

/*

DELETE FROM opening_checklists  WHERE notes LIKE '%[TEST]%';
DELETE FROM closing_checklists  WHERE notes LIKE '%[TEST]%';
DELETE FROM daily_sales         WHERE notes LIKE '%[TEST]%';
DELETE FROM leaves              WHERE reason LIKE '%[TEST]%';
DELETE FROM reimbursements      WHERE notes LIKE '%[TEST]%';

-- Attendance punches don't have notes — delete by time range (test times)
DELETE FROM attendance_punches
WHERE time IN ('09:07', '22:48')
  AND date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date;

*/
