import { NextResponse } from "next/server";
import { enforceRateLimit, enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import { createRovexoIdea } from "@/lib/rovexo-ideas/repository";
import { submitRovexoIdeaSchema } from "@/lib/rovexo-ideas/schemas";
import { uploadStorageObject, StorageValidationError } from "@/lib/storage/upload";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "rovexo-ideas-submit", 5, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const userLimited = await enforceRateLimitForUser(auth.user.id, "rovexo-ideas-submit", 3, 3_600_000);
  if (userLimited) return userLimited;

  const contentType = request.headers.get("content-type") ?? "";
  let subject = "";
  let body = "";
  let screenshotFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    subject = String(formData.get("subject") ?? "");
    body = String(formData.get("body") ?? "");
    const file = formData.get("screenshot");
    screenshotFile = file instanceof File && file.size > 0 ? file : null;
  } else {
    const json = await request.json().catch(() => null);
    subject = String(json?.subject ?? "");
    body = String(json?.body ?? "");
  }

  const parsed = submitRovexoIdeaSchema.safeParse({ subject, body });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid suggestion." },
      { status: 400 },
    );
  }

  let screenshotUrl: string | null = null;
  if (screenshotFile) {
    try {
      const extension = screenshotFile.name.split(".").pop() || "png";
      const path = `ideas/${auth.user.id}/${Date.now()}.${extension}`;
      const uploaded = await uploadStorageObject({
        bucket: "documents",
        path,
        file: screenshotFile,
      });
      screenshotUrl = uploaded.publicUrl;
    } catch (error) {
      if (error instanceof StorageValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: "Screenshot upload failed." }, { status: 400 });
    }
  }

  try {
    const idea = await createRovexoIdea({
      userId: auth.user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      screenshotUrl,
    });
    return NextResponse.json({ success: true, id: idea.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send suggestion." },
      { status: 400 },
    );
  }
}
