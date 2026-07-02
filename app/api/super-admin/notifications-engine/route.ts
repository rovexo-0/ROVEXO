import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateNotificationsEngineDraft,
  exportNotificationsEngineDocument,
  importNotificationsEngineDocument,
  publishNotificationsEngine,
  resetNotificationsEngineDraft,
  rollbackNotificationsEngine,
  saveNotificationsEngineDraft,
} from "@/lib/notifications-engine/engine";
import {
  NOTIFICATIONS_ENGINE_EVENTS,
  NOTIFICATIONS_ENGINE_FILTERS,
  NOTIFICATIONS_ENGINE_MODULES,
} from "@/lib/notifications-engine/registry";
import { getNotificationsEngineSnapshot } from "@/lib/notifications-engine/reader";
import type { NotificationsEngineDocument } from "@/lib/notifications-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getNotificationsEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: NOTIFICATIONS_ENGINE_MODULES,
      events: NOTIFICATIONS_ENGINE_EVENTS,
      filters: NOTIFICATIONS_ENGINE_FILTERS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportNotificationsEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importNotificationsEngineDocument(body.document as NotificationsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveNotificationsEngineDraft(body.document as NotificationsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishNotificationsEngine(auth.user.id);
      const snapshot = await getNotificationsEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackNotificationsEngine(body.historyId, auth.user.id);
      const snapshot = await getNotificationsEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetNotificationsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateNotificationsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Notifications Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
