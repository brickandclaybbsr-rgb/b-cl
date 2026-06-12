-- Public storage bucket for all uploaded files (staff documents, signatures,
-- payslips, reimbursement receipts, vendor bills). Replaces the old local
-- public/uploads/ folder, which does not work on Vercel's read-only filesystem.
--
-- Uploads/deletes run through the service-role key (bypasses RLS), so no extra
-- Storage policies are needed; public = true allows read access by URL.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do update set public = excluded.public;
