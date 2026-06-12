-- ═══════════════════════════════════════════════════════════════════════════
-- SQL Migration: Add Profiles Fields and Documents Constraints
-- Run this in the Supabase SQL Editor (Project → SQL → New query).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add payroll & personal details columns to profiles table (if missing)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhar_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS basic_pay numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_through text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personal_email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;

-- 2. Add operational & organization columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_joining date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS work_location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS working_hours text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employment_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reporting_authority uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;

-- 3. Modify check constraints on staff_documents to support Aadhar & PAN
ALTER TABLE public.staff_documents DROP CONSTRAINT IF EXISTS staff_documents_type_check;
ALTER TABLE public.staff_documents ADD CONSTRAINT staff_documents_type_check CHECK (type IN ('appointment_letter', 'salary_slip', 'aadhar_card', 'pan_card'));
