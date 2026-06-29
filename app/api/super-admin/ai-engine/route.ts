import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateAiEngineDraft,
  exportAiEngineDocument,
  importAiEngineDocument,
  publishAiEngine,
  resetAiEngineDraft,
  rollbackAiEngine,
  saveAiEngineDraft,
} from "@/lib/ai-engine/engine";
import {
  AI_ENGINE_MODULES,
  AI_ENGINE_PROVIDERS,
  AI_ENGINE_ROLES,
} from "@/lib/ai-engine/registry";
import { getAiEngineSnapshot } from "@/lib/ai-engine/reader";
import type { AiEngineDocument } from "@/lib/ai-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getAiEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: AI_ENGINE_MODULES,
      providers: AI_ENGINE_PROVIDERS,
      roles: AI_ENGINE_ROLES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportAiEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importAiEngineDocument(body.document as AiEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveAiEngineDraft(body.document as AiEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishAiEngine(auth.user.id);
      const snapshot = await getAiEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackAiEngine(body.historyId, auth.user.id);
      const snapshot = await getAiEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetAiEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateAiEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update AI Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
