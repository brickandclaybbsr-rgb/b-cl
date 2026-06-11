-- Update check constraint on reimbursements status to allow 'paid'
alter table public.reimbursements drop constraint if exists reimbursements_status_check;
alter table public.reimbursements add constraint reimbursements_status_check check (status in ('pending', 'approved', 'rejected', 'paid'));
