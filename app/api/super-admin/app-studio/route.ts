import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateAppStudioDraft,
  exportAppStudioDocument,
  importAppStudioDocument,
  publishAppStudio,
  resetAppStudioDraft,
  rollbackAppStudio,
  saveAppStudioDraft,
} from "@/lib/app-studio/engine";
import {
  APP_STUDIO_MODULES,
  APP_STUDIO_NAV_SECTIONS,
  APP_STUDIO_PAGE_TYPES,
  APP_STUDIO_SIMULATOR_DEVICES,
} from "@/lib/app-studio/registry";
import { getAppStudioSnapshot } from "@/lib/app-studio/snapshot";
import type { AppStudioDocument } from "@/lib/app-studio/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getAppStudioSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: APP_STUDIO_MODULES,
      navSections: APP_STUDIO_NAV_SECTIONS,
      pageTypes: APP_STUDIO_PAGE_TYPES,
      simulatorDevices: APP_STUDIO_SIMULATOR_DEVICES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportAppStudioDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importAppStudioDocument(body.document as AppStudioDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveAppStudioDraft(body.document as AppStudioDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishAppStudio(auth.user.id);
      const snapshot = await getAppStudioSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackAppStudio(body.historyId, auth.user.id);
      const snapshot = await getAppStudioSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetAppStudioDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateAppStudioDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update App Studio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
