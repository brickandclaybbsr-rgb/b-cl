-- ═══════════════════════════════════════════════════════════════════════════
--  Brick & Clay Ops — Seed Data
--  Run AFTER schema.sql. Idempotent (skips rows that already exist by name).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Stock items ────────────────────────────────────────────────────────────
insert into public.stock_items (name, category)
select v.name, v.category
from (values
  ('Mozzarella Cheese', 'Dairy'),
  ('Pizza Dough', 'Base'),
  ('Tomato Sauce', 'Base'),
  ('Olive Oil', 'Base'),
  ('Wood (Fuel)', 'Fuel'),
  ('Bell Peppers', 'Vegetables'),
  ('Onions', 'Vegetables'),
  ('Mushrooms', 'Vegetables'),
  ('Chicken', 'Toppings'),
  ('Paneer', 'Toppings'),
  ('Sweet Corn', 'Toppings'),
  ('Olives', 'Toppings'),
  ('Jalapeños', 'Toppings'),
  ('Chili Flakes', 'Seasoning'),
  ('Oregano', 'Seasoning'),
  ('Disposable Boxes', 'Packaging'),
  ('Tissue Paper', 'Packaging'),
  ('Packaging Material', 'Packaging'),
  ('Cold Drinks / Beverages', 'Beverages'),
  ('Water Bottles', 'Beverages')
) as v(name, category)
where not exists (
  select 1 from public.stock_items s where s.name = v.name
);

-- ── Opening checklist items ────────────────────────────────────────────────
insert into public.checklist_items (type, section, label, sort_order)
select 'opening', v.section, v.label, v.ord
from (values
  ('Kitchen', 'Gas cylinders checked', 1),
  ('Kitchen', 'Wood fire oven preheated', 2),
  ('Kitchen', 'Prep ingredients stocked (dough, sauce, toppings)', 3),
  ('Kitchen', 'Refrigerator temperatures checked', 4),
  ('Kitchen', 'All utensils clean and in place', 5),
  ('Kitchen', 'Exhaust fans working', 6),
  ('Front Desk / Dining', 'POS system (Petpooja) turned on and working', 7),
  ('Front Desk / Dining', 'Dining area cleaned and tables set', 8),
  ('Front Desk / Dining', 'Menu cards placed', 9),
  ('Front Desk / Dining', 'AC / fans working', 10),
  ('Front Desk / Dining', 'Music system on', 11),
  ('Front Desk / Dining', 'Entry area clean', 12),
  ('Staff', 'All scheduled staff present', 13),
  ('Staff', 'Uniforms on', 14)
) as v(section, label, ord)
where not exists (
  select 1 from public.checklist_items c
  where c.type = 'opening' and c.label = v.label
);

-- ── Closing checklist items ────────────────────────────────────────────────
insert into public.checklist_items (type, section, label, sort_order)
select 'closing', v.section, v.label, v.ord
from (values
  ('Kitchen', 'Gas valves closed', 1),
  ('Kitchen', 'Oven cleaned and shut down', 2),
  ('Kitchen', 'All perishables stored properly', 3),
  ('Kitchen', 'Leftover food labeled and refrigerated', 4),
  ('Kitchen', 'Kitchen surfaces cleaned', 5),
  ('Kitchen', 'Exhaust fans cleaned', 6),
  ('Kitchen', 'Trash taken out', 7),
  ('Front Desk / Dining', 'POS system closed and billing reconciled', 8),
  ('Front Desk / Dining', 'Dining area cleaned', 9),
  ('Front Desk / Dining', 'Tables wiped and chairs stacked', 10),
  ('Front Desk / Dining', 'AC / fans off', 11),
  ('Front Desk / Dining', 'All lights off', 12),
  ('Front Desk / Dining', 'Entry locked', 13)
) as v(section, label, ord)
where not exists (
  select 1 from public.checklist_items c
  where c.type = 'closing' and c.label = v.label
);

-- ── Default app settings ───────────────────────────────────────────────────
insert into public.app_settings (key, value)
values ('owner_whatsapp_number', null)
on conflict (key) do nothing;
