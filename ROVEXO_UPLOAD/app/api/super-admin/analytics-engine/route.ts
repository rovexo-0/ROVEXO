import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateAnalyticsEngineDraft,
  exportAnalyticsEngineDocument,
  importAnalyticsEngineDocument,
  publishAnalyticsEngine,
  resetAnalyticsEngineDraft,
  rollbackAnalyticsEngine,
  saveAnalyticsEngineDraft,
} from "@/lib/analytics-engine/engine";
import {
  ANALYTICS_ENGINE_LIVE_CHARTS,
  ANALYTICS_ENGINE_LIVE_METRICS,
  ANALYTICS_ENGINE_MODULES,
} from "@/lib/analytics-engine/registry";
import { getAnalyticsEngineSnapshot } from "@/lib/analytics-engine/reader";
import type { AnalyticsEngineDocument } from "@/lib/analytics-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getAnalyticsEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: ANALYTICS_ENGINE_MODULES,
      liveMetrics: ANALYTICS_ENGINE_LIVE_METRICS,
      liveCharts: ANALYTICS_ENGINE_LIVE_CHARTS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportAnalyticsEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importAnalyticsEngineDocument(body.document as AnalyticsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveAnalyticsEngineDraft(body.document as AnalyticsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishAnalyticsEngine(auth.user.id);
      const snapshot = await getAnalyticsEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackAnalyticsEngine(body.historyId, auth.user.id);
      const snapshot = await getAnalyticsEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetAnalyticsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateAnalyticsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Analytics Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
