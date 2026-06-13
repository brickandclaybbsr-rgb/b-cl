-- Attendance punches for Sandeep Nayak ("sande" in biometric)
-- Run in Supabase SQL Editor
-- This uses his profile ID by name lookup — verify the name matches exactly

DO $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE name = 'Sandeep Nayak' LIMIT 1;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for Sandeep Nayak — check the name in profiles table';
  END IF;

  -- Insert punches (ON CONFLICT DO NOTHING skips duplicates)
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

  RAISE NOTICE 'Done — inserted punches for Sandeep Nayak';
END $$;