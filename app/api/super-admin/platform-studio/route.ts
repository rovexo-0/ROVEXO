import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicatePlatformStudioDraft,
  getPlatformStudioSnapshot,
  publishPlatformStudio,
  resetPlatformStudioDraft,
  rollbackPlatformStudio,
  savePlatformStudioDraft,
} from "@/lib/platform-studio/engine";
import {
  PLATFORM_STUDIO_FIELD_TYPES,
  PLATFORM_STUDIO_MODULES,
  PLATFORM_STUDIO_PERMISSIONS,
  PLATFORM_STUDIO_WIDGET_TYPES,
} from "@/lib/platform-studio/registry";
import type { PlatformStudioDocument } from "@/lib/platform-studio/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getPlatformStudioSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      fieldTypes: PLATFORM_STUDIO_FIELD_TYPES,
      widgets: PLATFORM_STUDIO_WIDGET_TYPES,
      permissions: PLATFORM_STUDIO_PERMISSIONS,
      modules: PLATFORM_STUDIO_MODULES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const snapshot = await getPlatformStudioSnapshot();
      return NextResponse.json({ ok: true, document: snapshot.draft });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await savePlatformStudioDraft(body.document as PlatformStudioDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await savePlatformStudioDraft(body.document as PlatformStudioDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishPlatformStudio(auth.user.id);
      const snapshot = await getPlatformStudioSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackPlatformStudio(body.historyId, auth.user.id);
      const snapshot = await getPlatformStudioSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetPlatformStudioDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicatePlatformStudioDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Platform Studio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
