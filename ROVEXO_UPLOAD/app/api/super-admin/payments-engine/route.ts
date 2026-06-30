import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicatePaymentsEngineDraft,
  exportPaymentsEngineDocument,
  importPaymentsEngineDocument,
  publishPaymentsEngine,
  resetPaymentsEngineDraft,
  rollbackPaymentsEngine,
  savePaymentsEngineDraft,
} from "@/lib/payments-engine/engine";
import {
  PAYMENTS_ENGINE_FILTERS,
  PAYMENTS_ENGINE_MODULES,
  PAYMENTS_ENGINE_TIMELINE_EVENTS,
} from "@/lib/payments-engine/registry";
import { getPaymentsEngineSnapshot } from "@/lib/payments-engine/reader";
import type { PaymentsEngineDocument } from "@/lib/payments-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getPaymentsEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: PAYMENTS_ENGINE_MODULES,
      timelineEvents: PAYMENTS_ENGINE_TIMELINE_EVENTS,
      filters: PAYMENTS_ENGINE_FILTERS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportPaymentsEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importPaymentsEngineDocument(body.document as PaymentsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await savePaymentsEngineDraft(body.document as PaymentsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishPaymentsEngine(auth.user.id);
      const snapshot = await getPaymentsEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackPaymentsEngine(body.historyId, auth.user.id);
      const snapshot = await getPaymentsEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetPaymentsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicatePaymentsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Payments Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
