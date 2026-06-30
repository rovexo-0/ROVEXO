import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateSecurityEngineDraft,
  exportSecurityEngineDocument,
  importSecurityEngineDocument,
  publishSecurityEngine,
  resetSecurityEngineDraft,
  rollbackSecurityEngine,
  saveSecurityEngineDraft,
} from "@/lib/security-engine/engine";
import {
  SECURITY_ENGINE_AUTH_METHODS,
  SECURITY_ENGINE_MODULES,
  SECURITY_ENGINE_ROLES,
} from "@/lib/security-engine/registry";
import { getSecurityEngineSnapshot } from "@/lib/security-engine/reader";
import type { SecurityEngineDocument } from "@/lib/security-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getSecurityEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: SECURITY_ENGINE_MODULES,
      authMethods: SECURITY_ENGINE_AUTH_METHODS,
      roles: SECURITY_ENGINE_ROLES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportSecurityEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importSecurityEngineDocument(body.document as SecurityEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveSecurityEngineDraft(body.document as SecurityEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishSecurityEngine(auth.user.id);
      const snapshot = await getSecurityEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackSecurityEngine(body.historyId, auth.user.id);
      const snapshot = await getSecurityEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetSecurityEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateSecurityEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Security Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
