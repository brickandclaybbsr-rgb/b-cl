-- ═══════════════════════════════════════════════════════════════════════════
-- BRICK & CLAY OPS — CLEANUP: DELETE ALL AUDIT SAMPLE DATA
--
-- Run this in Supabase SQL Editor AFTER you have finished auditing the app.
-- It deletes ONLY the rows inserted by 20260614_audit_sample_data.sql.
-- All real data is untouched.
--
-- Every row is identified by the [AUDIT-TEST] tag in its notes/name/reason.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Checklists
DELETE FROM public.opening_checklists WHERE notes LIKE '%[AUDIT-TEST]%';
DELETE FROM public.closing_checklists WHERE notes LIKE '%[AUDIT-TEST]%';

-- 2. Daily Sales
DELETE FROM public.daily_sales WHERE notes LIKE '%[AUDIT-TEST]%';

-- 3. Stock Snapshots
--    Tagged via the item note field inside the JSONB; we delete snapshots
--    whose items contain the audit tag OR were submitted within the last 24h
--    with an explicit note column if available. We use a JSON-path match.
DELETE FROM public.stock_snapshots
WHERE items::text LIKE '%[AUDIT-TEST]%';

-- 4. Vendor Orders
DELETE FROM public.vendor_orders WHERE notes LIKE '%[AUDIT-TEST]%';
DELETE FROM public.vendor_orders WHERE items LIKE '%[AUDIT-TEST]%';

-- 5. Purchases
DELETE FROM public.purchases WHERE notes LIKE '%[AUDIT-TEST]%';
DELETE FROM public.purchases WHERE items LIKE '%[AUDIT-TEST]%';

-- 6. Cash Expenses
DELETE FROM public.cash_expenses WHERE notes LIKE '%[AUDIT-TEST]%';
DELETE FROM public.cash_expenses WHERE person_name LIKE '%[AUDIT-TEST]%';

-- 7. Reimbursements
DELETE FROM public.reimbursements WHERE notes LIKE '%[AUDIT-TEST]%';
DELETE FROM public.reimbursements WHERE purpose LIKE '%[AUDIT-TEST]%';

-- 8. Attendance Punches
DELETE FROM public.attendance_punches WHERE name LIKE '%[AUDIT-TEST]%';

-- 9. Leaves
DELETE FROM public.leaves WHERE reason LIKE '%[AUDIT-TEST]%';

COMMIT;

-- ── Verification: all counts should be 0 ─────────────────────────────────
SELECT 'opening_checklists' AS tbl, count(*) AS remaining
  FROM public.opening_checklists WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'closing_checklists', count(*)
  FROM public.closing_checklists WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'daily_sales', count(*)
  FROM public.daily_sales WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'stock_snapshots', count(*)
  FROM public.stock_snapshots WHERE items::text LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'vendor_orders', count(*)
  FROM public.vendor_orders WHERE notes LIKE '%[AUDIT-TEST]%' OR items LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'purchases', count(*)
  FROM public.purchases WHERE notes LIKE '%[AUDIT-TEST]%' OR items LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'cash_expenses', count(*)
  FROM public.cash_expenses WHERE notes LIKE '%[AUDIT-TEST]%' OR person_name LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'reimbursements', count(*)
  FROM public.reimbursements WHERE notes LIKE '%[AUDIT-TEST]%' OR purpose LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'attendance_punches', count(*)
  FROM public.attendance_punches WHERE name LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'leaves', count(*)
  FROM public.leaves WHERE reason LIKE '%[AUDIT-TEST]%';
