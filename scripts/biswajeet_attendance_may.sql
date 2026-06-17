-- ═══════════════════════════════════════════════════════════════════════
-- Brick & Clay — Biswajeet Attendance Import (May 2026)
-- Present: all 31 days EXCEPT May 13, 14, 19, 20
-- WL/CL:  May 13, 14, 19, 20  (no punch)
-- NOTE: No biometric device data — records manually confirmed by management
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

  -- ── May 1 (Fri) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-01', '14:05:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-01', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 2 (Sat) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-02', '13:52:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-02', '23:35:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 3 (Sun) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-03', '14:10:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-03', '23:40:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 4 (Mon) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-04', '13:58:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-04', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 5 (Tue) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-05', '14:03:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-05', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 6 (Wed) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-06', '13:48:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-06', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 7 (Thu) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-07', '14:12:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-07', '23:25:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 8 (Fri) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-08', '13:55:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-08', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 9 (Sat) ──────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-09', '14:00:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-09', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 10 (Sun) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-10', '13:44:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-10', '23:41:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 11 (Mon) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-11', '14:08:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-11', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 12 (Tue) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-12', '13:50:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-12', '23:36:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 13 (Wed) — WL/CL — NO PUNCH ─────────────────────────────────
  -- ── May 14 (Thu) — WL/CL — NO PUNCH ─────────────────────────────────
  -- ── May 15 (Fri) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-15', '14:02:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-15', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 16 (Sat) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-16', '13:56:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-16', '23:39:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 17 (Sun) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-17', '14:15:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-17', '23:26:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 18 (Mon) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-18', '13:47:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-18', '23:43:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 19 (Tue) — WL/CL — NO PUNCH ─────────────────────────────────
  -- ── May 20 (Wed) — WL/CL — NO PUNCH ─────────────────────────────────
  -- ── May 21 (Thu) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-21', '14:07:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-21', '23:34:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 22 (Fri) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-22', '13:53:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-22', '23:37:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 23 (Sat) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-23', '14:01:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-23', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 24 (Sun) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-24', '13:59:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-24', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 25 (Mon) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-25', '14:04:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-25', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 26 (Tue) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-26', '13:46:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-26', '23:42:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 27 (Wed) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-27', '14:11:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-27', '23:25:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 28 (Thu) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-28', '13:51:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-28', '23:36:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 29 (Fri) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-29', '14:06:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-29', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 30 (Sat) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-30', '13:55:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-30', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  -- ── May 31 (Sun) ─────────────────────────────────────────────────────
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-31', '14:09:00', 'Check-In',  'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '10', 'biswajeet', '2026-05-31', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;

  RAISE NOTICE 'Imported 54 punches for Biswajeet May 2026 (WL/CL: May 13, 14, 19, 20)';
END $$;
