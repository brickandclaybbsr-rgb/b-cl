import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Single public bucket for all uploaded files (staff docs, signatures, payslips,
 * reimbursement receipts, vendor bills). Public-by-URL — same access model as the
 * old `public/uploads/` folder — but stored in Supabase Storage so it works on
 * Vercel's read-only serverless filesystem.
 *
 * Uploads/deletes use the service-role client (bypasses Storage RLS); the calling
 * server actions already enforce their own auth (requireOwner / requireProfile).
 */
const BUCKET = "documents";

/** Upload a file and return its public URL. Overwrites if the path already exists. */
export async function uploadPublicFile(
  folder: string,
  filename: string,
  data: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = createAdminClient();
  const objectPath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, data, { contentType, upsert: true });
  if (error) throw new Error(error.message);

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return pub.publicUrl;
}

/** Best-effort delete by public URL. No-op for legacy `/uploads/...` paths or empty values. */
export async function deletePublicFile(publicUrl: string | null | undefined) {
  if (!publicUrl) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // legacy local path or external URL — nothing to remove
  const objectPath = decodeURIComponent(publicUrl.slice(idx + marker.length));

  try {
    const supabase = createAdminClient();
    await supabase.storage.from(BUCKET).remove([objectPath]);
  } catch (err) {
    console.warn("Storage delete failed:", err);
  }
}
