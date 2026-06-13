-- ═══════════════════════════════════════════════════════════════════════
-- Brick & Clay — Historical Attendance Import (Apr–Jun 2026)
-- Staff: Pradosh, Ramahari, Sandeep Nayak, Manoj
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Pradosh Ray (74 punches) ───────────────────────────────
DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE name = 'Pradosh Ray' LIMIT 1;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found: Pradosh Ray';
  END IF;

  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-01', '13:59:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-01', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-02', '14:06:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-03', '11:03:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-06', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-06', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-07', '11:14:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-07', '20:58:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-09', '13:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-09', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-10', '13:35:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-10', '22:57:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-13', '13:31:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-14', '14:01:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-14', '23:34:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-15', '11:02:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-15', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-16', '11:15:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-16', '19:35:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-20', '14:06:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-20', '23:40:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-22', '13:12:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-23', '13:44:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-23', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-24', '13:40:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-24', '22:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-28', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-29', '13:46:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-29', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-30', '14:07:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-04-30', '23:24:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-01', '10:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-01', '21:23:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-04', '12:35:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-04', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-05', '13:58:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-05', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-06', '13:31:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-06', '22:01:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-08', '13:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-08', '23:55:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-11', '14:09:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-12', '00:21:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-12', '11:57:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-14', '13:52:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-14', '23:36:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-15', '12:34:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-18', '14:12:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-19', '10:28:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-19', '20:00:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-21', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-21', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-22', '13:01:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-22', '23:49:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-26', '13:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-26', '23:34:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-27', '12:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-29', '11:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-05-29', '23:42:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-02', '14:02:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-02', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-03', '11:09:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-03', '21:54:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-04', '14:25:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-04', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-05', '11:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-05', '23:46:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-08', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-08', '23:11:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-09', '11:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-09', '19:09:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-11', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-12', '13:58:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '2', 'pradosh', '2026-06-12', '23:48:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  RAISE NOTICE 'Imported 74 punches for Pradosh Ray';
END $$;

-- ─── Ramahari Pradhan (61 punches) ───────────────────────────────
DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE name = 'Ramahari Pradhan' LIMIT 1;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found: Ramahari Pradhan';
  END IF;

  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-01', '14:08:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-01', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-02', '14:06:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-02', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-03', '14:09:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-03', '23:34:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-06', '14:03:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-06', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-08', '14:06:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-08', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-09', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-09', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-10', '14:02:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-10', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-15', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-15', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-16', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-16', '23:21:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-17', '13:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-17', '23:25:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-21', '13:49:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-21', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-27', '13:58:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-27', '23:21:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-28', '10:30:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-30', '14:03:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-04-30', '23:25:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-01', '14:22:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-01', '23:46:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-05', '10:45:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-05', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-11', '00:11:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-11', '14:10:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-13', '13:54:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-13', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-14', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-14', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-15', '23:49:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-19', '10:15:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-19', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-20', '13:53:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-20', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-25', '13:37:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-25', '23:51:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-26', '14:07:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-05-26', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-02', '10:35:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-02', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-04', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-04', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-05', '13:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-05', '23:45:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-08', '11:34:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-08', '23:12:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-09', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-09', '23:20:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-10', '11:08:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-10', '23:23:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-11', '11:13:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-12', '11:13:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '6', 'ramahari', '2026-06-12', '23:47:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  RAISE NOTICE 'Imported 61 punches for Ramahari Pradhan';
END $$;

-- ─── Sandeep Nayak (59 punches) ───────────────────────────────
DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE name = 'Sandeep Nayak' LIMIT 1;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found: Sandeep Nayak';
  END IF;

  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-03', '11:03:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-07', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-07', '23:36:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-09', '10:15:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-09', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-10', '10:30:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-10', '22:57:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-16', '11:11:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-16', '19:35:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-17', '10:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-17', '23:29:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-24', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-24', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-27', '10:41:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-27', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-28', '13:58:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-28', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-29', '10:59:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-30', '10:53:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-04-30', '23:26:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-01', '13:48:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-01', '23:46:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-07', '14:01:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-07', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-08', '13:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-08', '23:55:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-11', '00:14:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-11', '22:41:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-12', '12:07:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-12', '23:39:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-13', '10:36:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-13', '23:22:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-15', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-15', '23:48:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-18', '14:12:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-18', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-19', '14:02:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-19', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-20', '11:14:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-20', '23:30:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-21', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-21', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-25', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-25', '23:49:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-05-27', '10:53:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-01', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-01', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-05', '13:54:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-05', '23:46:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-08', '12:17:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-08', '23:10:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-09', '13:59:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-09', '23:03:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-10', '13:54:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-10', '23:21:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-11', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-11', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-12', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '8', 'sande', '2026-06-12', '23:48:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  RAISE NOTICE 'Imported 59 punches for Sandeep Nayak';
END $$;

-- ─── Manoj Naik (77 punches) ───────────────────────────────
DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE name = 'Manoj Naik' LIMIT 1;
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found: Manoj Naik';
  END IF;

  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-03', '14:41:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-06', '14:44:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-06', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-07', '16:07:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-07', '23:37:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-14', '14:01:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-14', '23:35:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-15', '14:09:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-15', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-16', '13:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-20', '13:55:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-20', '23:36:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-22', '13:59:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-22', '23:35:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-23', '13:43:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-23', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-24', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-24', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-27', '13:58:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-27', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-28', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-28', '23:38:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-29', '13:46:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-29', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-30', '14:07:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-04-30', '23:24:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-01', '10:43:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-04', '13:52:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-04', '23:37:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-05', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-05', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-06', '13:53:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-07', '14:01:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-07', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-08', '13:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-08', '23:54:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-11', '00:15:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-11', '14:10:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-12', '13:36:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-13', '13:33:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-13', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-18', '14:13:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-18', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-19', '14:02:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-19', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-20', '13:53:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-20', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-21', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-21', '23:31:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-22', '13:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-22', '23:42:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-25', '10:14:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-25', '18:45:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-28', '14:14:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-28', '23:41:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-29', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-05-29', '23:17:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-01', '13:59:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-01', '23:32:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-02', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-02', '23:28:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-03', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-03', '23:57:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-04', '14:25:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-04', '23:27:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-05', '11:50:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-05', '23:45:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-08', '14:04:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-08', '23:10:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-09', '14:00:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-09', '23:03:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-10', '13:54:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-10', '23:21:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-11', '13:56:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-11', '23:33:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-12', '13:57:00', 'Check-In', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  INSERT INTO public.attendance_punches (profile_id, pin, name, date, time, status, dept_name) VALUES (v_profile_id, '9', 'manoj', '2026-06-12', '23:48:00', 'Check-Out', 'Brickandclay') ON CONFLICT (profile_id, date, time) DO NOTHING;
  RAISE NOTICE 'Imported 77 punches for Manoj Naik';
END $$;
