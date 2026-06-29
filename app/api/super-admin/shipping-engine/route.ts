import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateShippingEngineDraft,
  exportShippingEngineDocument,
  importShippingEngineDocument,
  publishShippingEngine,
  resetShippingEngineDraft,
  rollbackShippingEngine,
  saveShippingEngineDraft,
} from "@/lib/shipping-engine/engine";
import {
  FUTURE_CARRIER_IDS,
  SHIPPING_ENGINE_MODULES,
  SHIPPING_ENGINE_TRACKING_STAGES,
} from "@/lib/shipping-engine/registry";
import { getShippingEngineSnapshot } from "@/lib/shipping-engine/reader";
import type { ShippingEngineDocument } from "@/lib/shipping-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getShippingEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: SHIPPING_ENGINE_MODULES,
      trackingStages: SHIPPING_ENGINE_TRACKING_STAGES,
      futureCarriers: FUTURE_CARRIER_IDS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportShippingEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importShippingEngineDocument(body.document as ShippingEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveShippingEngineDraft(body.document as ShippingEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishShippingEngine(auth.user.id);
      const snapshot = await getShippingEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackShippingEngine(body.historyId, auth.user.id);
      const snapshot = await getShippingEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetShippingEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateShippingEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Shipping Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
