import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateMissionControlEngineDraft,
  exportMissionControlEngineDocument,
  importMissionControlEngineDocument,
  publishMissionControlEngine,
  resetMissionControlEngineDraft,
  rollbackMissionControlEngine,
  saveMissionControlEngineDraft,
} from "@/lib/mission-control-engine/engine";
import { MISSION_CONTROL_ENGINE_SECTIONS } from "@/lib/mission-control-engine/registry";
import { getMissionControlEngineSnapshot } from "@/lib/mission-control-engine/reader";
import type { MissionControlEngineDocument } from "@/lib/mission-control-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getMissionControlEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: { sections: MISSION_CONTROL_ENGINE_SECTIONS },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportMissionControlEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importMissionControlEngineDocument(
        body.document as MissionControlEngineDocument,
        auth.user.id,
      );
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveMissionControlEngineDraft(
        body.document as MissionControlEngineDocument,
        auth.user.id,
      );
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishMissionControlEngine(auth.user.id);
      const snapshot = await getMissionControlEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackMissionControlEngine(body.historyId, auth.user.id);
      const snapshot = await getMissionControlEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetMissionControlEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateMissionControlEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Mission Control Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
