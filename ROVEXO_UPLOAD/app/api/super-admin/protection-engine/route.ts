import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateProtectionEngineDraft,
  exportProtectionEngineDocument,
  importProtectionEngineDocument,
  publishProtectionEngine,
  resetProtectionEngineDraft,
  rollbackProtectionEngine,
  saveProtectionEngineDraft,
} from "@/lib/protection-engine/engine";
import {
  PROTECTION_ENGINE_FILTERS,
  PROTECTION_ENGINE_MODULES,
  PROTECTION_ENGINE_TIMELINE_EVENTS,
} from "@/lib/protection-engine/registry";
import { getProtectionEngineSnapshot } from "@/lib/protection-engine/reader";
import type { ProtectionEngineDocument } from "@/lib/protection-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getProtectionEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: PROTECTION_ENGINE_MODULES,
      timelineEvents: PROTECTION_ENGINE_TIMELINE_EVENTS,
      filters: PROTECTION_ENGINE_FILTERS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportProtectionEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importProtectionEngineDocument(body.document as ProtectionEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveProtectionEngineDraft(body.document as ProtectionEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishProtectionEngine(auth.user.id);
      const snapshot = await getProtectionEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackProtectionEngine(body.historyId, auth.user.id);
      const snapshot = await getProtectionEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetProtectionEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateProtectionEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Protection Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
