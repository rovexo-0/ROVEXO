import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUploadFile } from "@/lib/storage/upload";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    validateUploadFile("documents", file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.type === "application/pdf" ? "pdf" : "jpg";
    const path = `${auth.user.id}/support/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

    const admin = createAdminClient();
    const { error } = await admin.storage.from("documents").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }

    return NextResponse.json({ path: `documents/${path}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
