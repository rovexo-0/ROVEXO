import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateOrdersEngineDraft,
  exportOrdersEngineDocument,
  importOrdersEngineDocument,
  publishOrdersEngine,
  resetOrdersEngineDraft,
  rollbackOrdersEngine,
  saveOrdersEngineDraft,
} from "@/lib/orders-engine/engine";
import {
  ORDERS_ENGINE_FILTERS,
  ORDERS_ENGINE_MODULES,
  ORDERS_ENGINE_TIMELINE_EVENTS,
} from "@/lib/orders-engine/registry";
import { getOrdersEngineSnapshot } from "@/lib/orders-engine/reader";
import type { OrdersEngineDocument } from "@/lib/orders-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getOrdersEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: ORDERS_ENGINE_MODULES,
      timelineEvents: ORDERS_ENGINE_TIMELINE_EVENTS,
      filters: ORDERS_ENGINE_FILTERS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportOrdersEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importOrdersEngineDocument(body.document as OrdersEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveOrdersEngineDraft(body.document as OrdersEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishOrdersEngine(auth.user.id);
      const snapshot = await getOrdersEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackOrdersEngine(body.historyId, auth.user.id);
      const snapshot = await getOrdersEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetOrdersEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateOrdersEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Orders Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
