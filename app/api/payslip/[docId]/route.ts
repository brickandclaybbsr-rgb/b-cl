import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const profile = await requireProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const supabase = createClient();
    const { data: doc, error } = await supabase
      .from("staff_documents")
      .select("file_url, profile_id, file_name, is_visible_to_staff")
      .eq("id", params.docId)
      .single();

    if (error || !doc) {
      return new NextResponse("Payslip not found", { status: 404 });
    }

    // Staff can only view their own visible payslips; owner can view all
    if (profile.role !== "owner") {
      if (doc.profile_id !== profile.id || !doc.is_visible_to_staff) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const res = await fetch(doc.file_url);
    if (!res.ok) {
      return new NextResponse("Could not fetch payslip file", { status: 502 });
    }

    const html = await res.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}
