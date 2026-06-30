import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateMessagesEngineDraft,
  exportMessagesEngineDocument,
  importMessagesEngineDocument,
  publishMessagesEngine,
  resetMessagesEngineDraft,
  rollbackMessagesEngine,
  saveMessagesEngineDraft,
} from "@/lib/messages-engine/engine";
import {
  MESSAGES_ENGINE_FILTERS,
  MESSAGES_ENGINE_MODULES,
  MESSAGES_ENGINE_SEARCH_SCOPES,
} from "@/lib/messages-engine/registry";
import { getMessagesEngineSnapshot } from "@/lib/messages-engine/reader";
import type { MessagesEngineDocument } from "@/lib/messages-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getMessagesEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: MESSAGES_ENGINE_MODULES,
      filters: MESSAGES_ENGINE_FILTERS,
      searchScopes: MESSAGES_ENGINE_SEARCH_SCOPES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportMessagesEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importMessagesEngineDocument(body.document as MessagesEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveMessagesEngineDraft(body.document as MessagesEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishMessagesEngine(auth.user.id);
      const snapshot = await getMessagesEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackMessagesEngine(body.historyId, auth.user.id);
      const snapshot = await getMessagesEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetMessagesEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateMessagesEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Messages Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
