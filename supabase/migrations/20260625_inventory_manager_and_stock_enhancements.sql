-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Expand the role CHECK constraint to include 'inventory_manager'
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'staff', 'inventory_manager'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Add min-stock and price columns to stock_items
--    min_qty / min_unit  → threshold below which status auto-suggests "low"
--    price_per_unit      → used to calculate total stock value
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS min_qty        NUMERIC,
  ADD COLUMN IF NOT EXISTS min_unit       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Fix stock_snapshots SELECT policy
--    Old: users could only read their OWN snapshots, so new staff couldn't
--    pre-populate the form from the last snapshot submitted by someone else.
--    New: any authenticated user can read all snapshots (same pattern as
--    checklists). INSERT still requires submitted_by = auth.uid().
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS stock_snap_select ON public.stock_snapshots;
CREATE POLICY stock_snap_select ON public.stock_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Allow inventory_manager (and staff) to insert new stock items inline
--    (quick-add on the stock form). Owner retains full CRUD.
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS stock_items_write ON public.stock_items;

-- Owner: full CRUD
CREATE POLICY stock_items_owner_write ON public.stock_items
  FOR ALL USING (public.is_owner()) WITH CHECK (public.is_owner());

-- Staff / inventory_manager: insert only (for quick-add)
CREATE POLICY stock_items_staff_insert ON public.stock_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
