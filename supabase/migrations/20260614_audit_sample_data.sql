-- ═══════════════════════════════════════════════════════════════════════════
-- BRICK & CLAY OPS — FULL APP AUDIT SAMPLE DATA
-- Run this in Supabase SQL Editor ONCE to seed test data across every section.
--
-- ⚠️  All rows are tagged with notes/names containing "[AUDIT-TEST]" so the
--     cleanup script can delete them precisely without touching real data.
--
-- SECTIONS COVERED:
--   1. Checklists  — Kitchen opening, Front Desk opening, Kitchen closing, Front Desk closing
--   2. Daily Sales — today's sales record
--   3. Stock       — a snapshot with mixed available/low/out statuses
--   4. Vendor Orders — pending + placed orders
--   5. Purchases   — two purchase records
--   6. Cash Expenses — withdrawal + advance + expense entries
--   7. Reimbursements — pending + approved claims
--   8. Attendance  — sample punch records for today
--   9. Leaves      — pending leave request
--
-- HOW TO USE:
--   1. Run this entire script in the Supabase SQL Editor.
--   2. Open the app and verify each section shows the test data.
--   3. Run 20260614_cleanup_audit_sample_data.sql to delete everything inserted here.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_today       date    := current_date AT TIME ZONE 'Asia/Kolkata';
  v_yesterday   date    := (current_date AT TIME ZONE 'Asia/Kolkata') - interval '1 day';
  v_2days_ago   date    := (current_date AT TIME ZONE 'Asia/Kolkata') - interval '2 days';

  -- Pick a real owner profile id (first active owner found)
  v_owner_id    uuid;
  -- Pick a real kitchen staff id (first active kitchen staff found)
  v_kitchen_id  uuid;
  -- Pick a real front_desk staff id (first active front_desk staff found)
  v_frontdesk_id uuid;
  -- Pick any real vendor id (first active vendor found)
  v_vendor_id   uuid;
  -- Pick any real stock item ids
  v_stock_items jsonb;

  -- IDs we create (stored so cleanup can reference them by date+team+notes)
BEGIN

  -- ── Resolve profile IDs ──────────────────────────────────────────────────
  SELECT id INTO v_owner_id
  FROM public.profiles WHERE role = 'owner' AND is_active = true LIMIT 1;

  SELECT id INTO v_kitchen_id
  FROM public.profiles WHERE team = 'kitchen' AND is_active = true LIMIT 1;

  SELECT id INTO v_frontdesk_id
  FROM public.profiles WHERE team = 'front_desk' AND is_active = true LIMIT 1;

  -- Fallback: use owner if no staff found
  IF v_kitchen_id IS NULL THEN v_kitchen_id := v_owner_id; END IF;
  IF v_frontdesk_id IS NULL THEN v_frontdesk_id := v_owner_id; END IF;

  -- ── Resolve vendor ID ────────────────────────────────────────────────────
  SELECT id INTO v_vendor_id
  FROM public.vendors WHERE is_active = true LIMIT 1;

  -- ── Build stock items JSONB from real stock_items ────────────────────────
  SELECT jsonb_agg(
    jsonb_build_object(
      'item_id',   item_id,
      'item_name', item_name,
      'status',    status,
      'note',      '[AUDIT-TEST] sample snapshot'
    )
  ) INTO v_stock_items
  FROM (
    SELECT
      id   AS item_id,
      name AS item_name,
      CASE row_number() OVER (ORDER BY name)
        WHEN 1 THEN 'out'
        WHEN 2 THEN 'low'
        ELSE 'available'
      END AS status
    FROM public.stock_items
    WHERE is_active = true
    LIMIT 10
  ) sub;


  RAISE NOTICE 'Owner: %, Kitchen: %, FrontDesk: %, Vendor: %',
    v_owner_id, v_kitchen_id, v_frontdesk_id, v_vendor_id;

  -- ════════════════════════════════════════════════════════════════════════
  -- 1. CHECKLISTS
  -- ════════════════════════════════════════════════════════════════════════

  -- Kitchen Opening (today)
  INSERT INTO public.opening_checklists (date, team, submitted_by, items, opening_cash, notes, submitted_at)
  VALUES (
    v_today,
    'kitchen',
    v_kitchen_id,
    '[
      {"section":"Kitchen","label":"Gas cylinders checked","checked":true},
      {"section":"Kitchen","label":"Wood fire oven preheated","checked":true},
      {"section":"Kitchen","label":"Prep ingredients stocked (dough, sauce, toppings)","checked":true},
      {"section":"Kitchen","label":"Refrigerator temperatures checked","checked":false,"note":"Fridge 2 slightly warm"},
      {"section":"Kitchen","label":"All utensils clean and in place","checked":true},
      {"section":"Kitchen","label":"Exhaust fans working","checked":true}
    ]'::jsonb,
    2500,
    '[AUDIT-TEST] Kitchen opening - sample data',
    now()
  )
  ON CONFLICT (date, team) DO NOTHING;

  -- Front Desk / Dining Opening (today)
  INSERT INTO public.opening_checklists (date, team, submitted_by, items, opening_cash, notes, submitted_at)
  VALUES (
    v_today,
    'front_desk',
    v_frontdesk_id,
    '[
      {"section":"Front Desk / Dining","label":"POS system (Petpooja) turned on and working","checked":true},
      {"section":"Front Desk / Dining","label":"Dining area cleaned and tables set","checked":true},
      {"section":"Front Desk / Dining","label":"Menu cards placed","checked":true},
      {"section":"Front Desk / Dining","label":"AC / fans working","checked":true},
      {"section":"Front Desk / Dining","label":"Music system on","checked":false,"note":"Speaker cable issue"},
      {"section":"Front Desk / Dining","label":"Entry area clean","checked":true},
      {"section":"Staff","label":"All scheduled staff present","checked":true},
      {"section":"Staff","label":"Uniforms on","checked":true}
    ]'::jsonb,
    null,
    '[AUDIT-TEST] Front Desk opening - sample data',
    now() + interval '5 minutes'
  )
  ON CONFLICT (date, team) DO NOTHING;

  -- Kitchen Closing (yesterday — simulating a complete day)
  INSERT INTO public.opening_checklists (date, team, submitted_by, items, opening_cash, notes, submitted_at)
  VALUES (
    v_yesterday,
    'kitchen',
    v_kitchen_id,
    '[{"section":"Kitchen","label":"Gas cylinders checked","checked":true}]'::jsonb,
    2200,
    '[AUDIT-TEST] yesterday kitchen opening',
    now() - interval '1 day'
  )
  ON CONFLICT (date, team) DO NOTHING;

  -- Kitchen Closing (today)
  INSERT INTO public.closing_checklists (date, team, submitted_by, items, closing_cash, cash_deposited, notes, closing_stock_updated, submitted_at)
  VALUES (
    v_today,
    'kitchen',
    v_kitchen_id,
    '[
      {"section":"Kitchen","label":"Gas valves closed","checked":true},
      {"section":"Kitchen","label":"Oven cleaned and shut down","checked":true},
      {"section":"Kitchen","label":"All perishables stored properly","checked":true},
      {"section":"Kitchen","label":"Leftover food labeled and refrigerated","checked":true},
      {"section":"Kitchen","label":"Kitchen surfaces cleaned","checked":true},
      {"section":"Kitchen","label":"Exhaust fans cleaned","checked":false,"note":"Will clean tomorrow morning"},
      {"section":"Kitchen","label":"Trash taken out","checked":true}
    ]'::jsonb,
    3800,
    3800,
    '[AUDIT-TEST] Kitchen closing - sample data',
    false,
    now() + interval '8 hours'
  )
  ON CONFLICT (date, team) DO NOTHING;

  -- Front Desk Closing (today)
  INSERT INTO public.closing_checklists (date, team, submitted_by, items, closing_cash, cash_deposited, notes, closing_stock_updated, submitted_at)
  VALUES (
    v_today,
    'front_desk',
    v_frontdesk_id,
    '[
      {"section":"Front Desk / Dining","label":"POS system closed and billing reconciled","checked":true},
      {"section":"Front Desk / Dining","label":"Dining area cleaned","checked":true},
      {"section":"Front Desk / Dining","label":"Tables wiped and chairs stacked","checked":true},
      {"section":"Front Desk / Dining","label":"AC / fans off","checked":true},
      {"section":"Front Desk / Dining","label":"All lights off","checked":true},
      {"section":"Front Desk / Dining","label":"Entry locked","checked":true}
    ]'::jsonb,
    null,
    null,
    '[AUDIT-TEST] Front Desk closing - sample data',
    false,
    now() + interval '9 hours'
  )
  ON CONFLICT (date, team) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════
  -- 2. DAILY SALES (today)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.daily_sales (
    date, submitted_by,
    opening_cash, cash_sales, card_sales, upi_sales,
    zomato_gold_sales, zomato_sales, swiggy_sales, swiggy_dineout_sales, eazy_diner_sales,
    online_sales, aggregator_sales, closing_balance,
    total_bills, discount_amount, complimentary_count, complimentary_value,
    notes, submitted_at
  )
  VALUES (
    v_today, v_frontdesk_id,
    2500, 8400, 3200, 4100,
    0, 2200, 1800, 0, 0,
    7300, 4000, 3800,
    47, 350, 2, 280,
    '[AUDIT-TEST] today sales',
    now() + interval '10 hours'
  )
  ON CONFLICT (date) DO NOTHING;

  -- Yesterday's sales (for trend chart)
  INSERT INTO public.daily_sales (
    date, submitted_by,
    opening_cash, cash_sales, card_sales, upi_sales,
    zomato_gold_sales, zomato_sales, swiggy_sales, swiggy_dineout_sales, eazy_diner_sales,
    online_sales, aggregator_sales, closing_balance,
    total_bills, discount_amount, complimentary_count, complimentary_value,
    notes, submitted_at
  )
  VALUES (
    v_yesterday, v_frontdesk_id,
    2200, 7200, 2900, 3800,
    0, 1900, 1500, 0, 0,
    6700, 3400, 3000,
    42, 200, 1, 180,
    '[AUDIT-TEST] yesterday sales',
    now() - interval '14 hours'
  )
  ON CONFLICT (date) DO NOTHING;

  -- 2 days ago (for trend chart)
  INSERT INTO public.daily_sales (
    date, submitted_by,
    opening_cash, cash_sales, card_sales, upi_sales,
    zomato_gold_sales, zomato_sales, swiggy_sales, swiggy_dineout_sales, eazy_diner_sales,
    online_sales, aggregator_sales, closing_balance,
    total_bills, discount_amount, complimentary_count, complimentary_value,
    notes, submitted_at
  )
  VALUES (
    v_2days_ago, v_frontdesk_id,
    2000, 6500, 2700, 3500,
    500, 1700, 1200, 0, 0,
    6200, 3400, 2900,
    39, 150, 0, 0,
    '[AUDIT-TEST] 2 days ago sales',
    now() - interval '38 hours'
  )
  ON CONFLICT (date) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════
  -- 3. STOCK SNAPSHOT (today)
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.stock_snapshots (date, submitted_by, items, submitted_at)
  VALUES (
    v_today,
    v_kitchen_id,
    COALESCE(v_stock_items, '[{"item_id":"00000000-0000-0000-0000-000000000001","item_name":"[AUDIT-TEST] Mozzarella Cheese","status":"low"},{"item_id":"00000000-0000-0000-0000-000000000002","item_name":"[AUDIT-TEST] Pizza Dough","status":"out"}]'::jsonb),
    now() + interval '2 hours'
  );

  -- ════════════════════════════════════════════════════════════════════════
  -- 4. VENDOR ORDERS
  -- ════════════════════════════════════════════════════════════════════════
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.vendor_orders (vendor_id, raised_by, items, urgency, status, notes, raised_at)
    VALUES
      (v_vendor_id, v_kitchen_id,  'Mozzarella 5kg, Pizza Dough 10kg, Tomato Sauce 3L [AUDIT-TEST]', 'urgent',  'pending', '[AUDIT-TEST] urgent restock', now()),
      (v_vendor_id, v_frontdesk_id,'Tissue Paper x20, Disposable Boxes x100 [AUDIT-TEST]',           'normal',  'placed',  '[AUDIT-TEST] placed order',   now() - interval '2 hours');
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- 5. PURCHASES
  -- ════════════════════════════════════════════════════════════════════════
  IF v_vendor_id IS NOT NULL THEN
    INSERT INTO public.purchases (vendor_id, submitted_by, items, amount, notes, purchased_at)
    VALUES
      (v_vendor_id, v_kitchen_id,  'Mozzarella 5kg, Olive Oil 2L [AUDIT-TEST]', 2800, '[AUDIT-TEST] daily purchase', now() - interval '1 hour'),
      (v_vendor_id, v_frontdesk_id,'Tissue Paper x20, Disposable Boxes x50 [AUDIT-TEST]', 650, '[AUDIT-TEST] supplies purchase', now() - interval '30 minutes');
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- 6. CASH EXPENSES
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.cash_expenses (date, person_name, amount, category, notes, submitted_by, submitted_at)
  VALUES
    (v_today, '[AUDIT-TEST] Ravi Kumar',   1500, 'withdrawal', '[AUDIT-TEST] daily salary withdrawal', v_frontdesk_id, now()),
    (v_today, '[AUDIT-TEST] Priya Sharma',  800, 'advance',    '[AUDIT-TEST] salary advance request',  v_frontdesk_id, now() + interval '20 minutes'),
    (v_today, '[AUDIT-TEST] Market Run',    450, 'expense',    '[AUDIT-TEST] grocery run for kitchen', v_kitchen_id,   now() + interval '1 hour'),
    (v_today, '[AUDIT-TEST] Petrol',        200, 'other',      '[AUDIT-TEST] delivery bike petrol',    v_kitchen_id,   now() + interval '2 hours');

  -- ════════════════════════════════════════════════════════════════════════
  -- 7. REIMBURSEMENTS
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.reimbursements (submitted_by, amount, purpose, status, notes, submitted_at)
  VALUES
    (v_kitchen_id,   750,  '[AUDIT-TEST] Gas cylinder transport cost', 'pending',  '[AUDIT-TEST] pending reimbursement', now()),
    (v_frontdesk_id, 320,  '[AUDIT-TEST] Stationery for POS area',     'approved', '[AUDIT-TEST] approved reimbursement', now() - interval '3 hours'),
    (v_kitchen_id,   1200, '[AUDIT-TEST] Emergency spice purchase',     'paid',     '[AUDIT-TEST] paid reimbursement', now() - interval '5 hours');

  -- ════════════════════════════════════════════════════════════════════════
  -- 8. ATTENDANCE PUNCHES (today)
  -- ════════════════════════════════════════════════════════════════════════
  -- Uses upsert so safe if profile_id+date+time already exists
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name, uploaded_by, uploaded_at)
  VALUES
    (v_kitchen_id,   '1001', '[AUDIT-TEST] Kitchen Staff', v_today, '09:00:00', 'IN',  'Kitchen',    v_owner_id, now()),
    (v_kitchen_id,   '1001', '[AUDIT-TEST] Kitchen Staff', v_today, '17:30:00', 'OUT', 'Kitchen',    v_owner_id, now()),
    (v_frontdesk_id, '1002', '[AUDIT-TEST] Dining Staff',  v_today, '09:15:00', 'IN',  'Front Desk', v_owner_id, now()),
    (v_frontdesk_id, '1002', '[AUDIT-TEST] Dining Staff',  v_today, '18:00:00', 'OUT', 'Front Desk', v_owner_id, now())
  ON CONFLICT (profile_id, date, time) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════
  -- 9. LEAVE REQUEST
  -- ════════════════════════════════════════════════════════════════════════
  INSERT INTO public.leaves (profile_id, leave_type, start_date, end_date, reason, status, submitted_at)
  VALUES
    (v_kitchen_id, 'cl', v_today + 3, v_today + 3, '[AUDIT-TEST] Personal work - sample leave request', 'pending', now());

  RAISE NOTICE '✅ AUDIT SAMPLE DATA INSERTED SUCCESSFULLY';
  RAISE NOTICE '   Run 20260614_cleanup_audit_sample_data.sql to delete all test rows.';

END $$;


-- ── Verification queries — run these to confirm data was inserted ───────────
SELECT 'opening_checklists' AS tbl, count(*) AS inserted
  FROM public.opening_checklists WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'closing_checklists', count(*)
  FROM public.closing_checklists WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'daily_sales', count(*)
  FROM public.daily_sales WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'stock_snapshots', count(*)
  FROM public.stock_snapshots WHERE submitted_at > now() - interval '10 minutes'
UNION ALL
SELECT 'vendor_orders', count(*)
  FROM public.vendor_orders WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'purchases', count(*)
  FROM public.purchases WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'cash_expenses', count(*)
  FROM public.cash_expenses WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'reimbursements', count(*)
  FROM public.reimbursements WHERE notes LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'attendance_punches', count(*)
  FROM public.attendance_punches WHERE name LIKE '%[AUDIT-TEST]%'
UNION ALL
SELECT 'leaves', count(*)
  FROM public.leaves WHERE reason LIKE '%[AUDIT-TEST]%';
