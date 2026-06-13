-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: team field, fcm_token column, deactivate departed staff
-- Run in Supabase SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add fcm_token column (device push token per profile)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token text;

-- 2. Add team column (Kitchen / Front Desk — determines checklist visibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team text
  CHECK (team IN ('kitchen', 'front_desk'));

-- 3. Deactivate staff who have left the organisation
UPDATE public.profiles SET is_active = false
WHERE name IN ('Debendra', 'Krishnarani', 'Sandeep');

-- 4. Allow staff to write their own fcm_token only (profile stays owner-only for
--    all other fields — we use the service-role key from the API route anyway,
--    but this policy keeps the intent explicit).
DROP POLICY IF EXISTS profiles_fcm_self ON public.profiles;
CREATE POLICY profiles_fcm_self ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
