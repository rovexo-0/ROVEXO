import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateIntegrationsEngineDraft,
  exportIntegrationsEngineDocument,
  importIntegrationsEngineDocument,
  publishIntegrationsEngine,
  resetIntegrationsEngineDraft,
  rollbackIntegrationsEngine,
  saveIntegrationsEngineDraft,
} from "@/lib/integrations-engine/engine";
import { INTEGRATIONS_ENGINE_MODULES } from "@/lib/integrations-engine/registry";
import { getIntegrationsEngineSnapshot } from "@/lib/integrations-engine/reader";
import type { IntegrationsEngineDocument } from "@/lib/integrations-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getIntegrationsEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: { modules: INTEGRATIONS_ENGINE_MODULES },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportIntegrationsEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importIntegrationsEngineDocument(body.document as IntegrationsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveIntegrationsEngineDraft(body.document as IntegrationsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishIntegrationsEngine(auth.user.id);
      const snapshot = await getIntegrationsEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackIntegrationsEngine(body.historyId, auth.user.id);
      const snapshot = await getIntegrationsEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetIntegrationsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateIntegrationsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Integrations Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
