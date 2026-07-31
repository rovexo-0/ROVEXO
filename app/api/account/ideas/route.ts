import { NextResponse } from "next/server";
import { enforceRateLimit, enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { requireApiAuth } from "@/lib/auth/session";
import {
  createRovexoIdea,
  findSimilarIdeas,
  getRovexoIdeasStats,
  listCommunityIdeas,
} from "@/lib/rovexo-ideas/repository";
import { listIdeasQuerySchema, submitRovexoIdeaSchema } from "@/lib/rovexo-ideas/schemas";
import { uploadStorageObject, StorageValidationError } from "@/lib/storage/upload";
import type { RovexoIdeaCategory, RovexoIdeasFilter } from "@/lib/rovexo-ideas/types";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const similar = url.searchParams.get("similar");
  if (similar !== null) {
    const ideas = await findSimilarIdeas({ query: similar, limit: 5 });
    return NextResponse.json({ ideas });
  }

  if (url.searchParams.get("stats") === "1") {
    const stats = await getRovexoIdeasStats();
    return NextResponse.json({ stats });
  }

  const parsed = listIdeasQuerySchema.safeParse({
    filter: url.searchParams.get("filter") ?? "top",
    q: url.searchParams.get("q") ?? "",
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? "20",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  }

  try {
    const result = await listCommunityIdeas({
      userId: auth.user.id,
      filter: parsed.data.filter as RovexoIdeasFilter,
      query: parsed.data.q,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load ideas." },
      { status: 400 },
    );
  }
}

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
  let category = "Buying";
  let screenshotFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    subject = String(formData.get("subject") ?? "");
    body = String(formData.get("body") ?? "");
    category = String(formData.get("category") ?? "Buying");
    const file = formData.get("screenshot");
    screenshotFile = file instanceof File && file.size > 0 ? file : null;
  } else {
    const json = await request.json().catch(() => null);
    subject = String(json?.subject ?? "");
    body = String(json?.body ?? "");
    category = String(json?.category ?? "Buying");
  }

  const parsed = submitRovexoIdeaSchema.safeParse({ subject, body, category });
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
      category: parsed.data.category as RovexoIdeaCategory,
      screenshotUrl,
    });
    return NextResponse.json({ success: true, idea });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send suggestion." },
      { status: 400 },
    );
  }
}
