import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  exportVisualCmsEngineDocument,
  importVisualCmsEngineDocument,
  patchVisualCmsEngineDraft,
  publishVisualCmsEngine,
  resetVisualCmsEngineDraft,
  rollbackVisualCmsEngine,
  saveVisualCmsEngineDraft,
  setVisualCmsPublishStage,
} from "@/lib/visual-cms-engine/engine";
import {
  VISUAL_CMS_BUILDERS,
  VISUAL_CMS_CANVAS_ELEMENTS,
} from "@/lib/visual-cms-engine/registry";
import { getVisualCmsEngineSnapshot } from "@/lib/visual-cms-engine/reader";
import type { VisualCmsEngineDocument, VisualCmsPublishStage } from "@/lib/visual-cms-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum([
    "save-draft",
    "publish",
    "rollback",
    "reset-draft",
    "duplicate",
    "export",
    "import",
    "preview",
    "compare-live",
    "approve",
  ]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

const patchSchema = z.object({
  action: z.literal("save-draft").optional(),
  document: z.record(z.string(), z.unknown()).optional(),
  publishStage: z.enum(["draft", "preview", "compare-live", "approve", "published"]).optional(),
  patch: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getVisualCmsEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      builders: VISUAL_CMS_BUILDERS,
      canvasElements: VISUAL_CMS_CANVAS_ELEMENTS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportVisualCmsEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importVisualCmsEngineDocument(
        body.document as VisualCmsEngineDocument,
        auth.user.id,
      );
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveVisualCmsEngineDraft(body.document as VisualCmsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "preview") {
      const draft = await setVisualCmsPublishStage("preview", auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "compare-live") {
      const draft = await setVisualCmsPublishStage("compare-live", auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "approve") {
      const draft = await setVisualCmsPublishStage("approve", auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "publish") {
      const published = await publishVisualCmsEngine(auth.user.id);
      const snapshot = await getVisualCmsEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackVisualCmsEngine(body.historyId, auth.user.id);
      const snapshot = await getVisualCmsEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetVisualCmsEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Visual CMS.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = patchSchema.parse(await request.json());

    if (body.document) {
      const saved = await saveVisualCmsEngineDraft(body.document as VisualCmsEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.publishStage) {
      const draft = await setVisualCmsPublishStage(body.publishStage as VisualCmsPublishStage, auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.patch) {
      const draft = await patchVisualCmsEngineDraft(body.patch as Partial<VisualCmsEngineDocument>, auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "No patch payload provided." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to patch Visual CMS.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
