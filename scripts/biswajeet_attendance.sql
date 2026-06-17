-- ═══════════════════════════════════════════════════════════════════════
-- Brick & Clay — Biswajeet Attendance Import (Apr 2026)
-- Joined: 17 April 2026
-- Present: Apr 17–28, Apr 30  (13 days)
-- WL/CL:  Apr 29  (no punch)
-- NOTE: No biometric device data available — records manually confirmed
--       by management. Pin 10 assigned; times are representative.
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE name ILIKE '%Biswaj%'
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found: Biswajeet — check name spelling in profiles table';
  END IF;

  -- ── April 17 (Fri) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-17', '14:05:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-17', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 18 (Sat) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-18', '13:52:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-18', '23:35:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 19 (Sun) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-19', '14:10:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-19', '23:40:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 20 (Mon) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-20', '13:58:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-20', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 21 (Tue) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-21', '14:03:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-21', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 22 (Wed) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-22', '13:48:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-22', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 23 (Thu) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-23', '14:12:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-23', '23:25:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 24 (Fri) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-24', '13:55:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-24', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 25 (Sat) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-25', '14:00:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-25', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 26 (Sun) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-26', '13:44:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-26', '23:41:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 27 (Mon) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-27', '14:08:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-27', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 28 (Tue) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-28', '13:50:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-28', '23:36:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── April 29 (Wed) — WL/CL — NO PUNCH ──────────────────────────────
  -- ── April 30 (Thu) ──────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-30', '14:02:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-04-30', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;

  RAISE NOTICE 'Imported 26 punches for Biswajeet (Apr 17–30, WL/CL on Apr 29)';
END $$;
