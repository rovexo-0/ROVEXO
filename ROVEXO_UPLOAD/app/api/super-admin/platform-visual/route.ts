import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  getPlatformVisualConfig,
  getPlatformVisualDraft,
  getPlatformVisualHistory,
} from "@/lib/platform-visual/reader";
import {
  duplicatePlatformVisualTheme,
  publishPlatformVisualTheme,
  resetPlatformVisualDraft,
  rollbackPlatformVisualTheme,
  savePlatformVisualDraft,
} from "@/lib/platform-visual/theme-engine";
import { STUDIO_ASSET_LIBRARY } from "@/lib/platform-visual/studio-pro/assets";
import {
  STUDIO_COMPONENT_LIBRARY,
  STUDIO_TEMPLATE_LIBRARY,
} from "@/lib/platform-visual/studio-pro/defaults";
import { STUDIO_MODULE_REGISTRY } from "@/lib/platform-visual/studio-pro/registry";
import type { PlatformVisualBundle } from "@/lib/platform-visual/types";

export const dynamic = "force-dynamic";

const saveSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "duplicate", "reset-draft", "export", "import"]),
  bundle: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const [live, draft, history] = await Promise.all([
    getPlatformVisualConfig({ mode: "live" }),
    getPlatformVisualDraft(),
    getPlatformVisualHistory(),
  ]);

  return NextResponse.json({
    live,
    draft,
    history,
    libraries: {
      components: STUDIO_COMPONENT_LIBRARY,
      templates: STUDIO_TEMPLATE_LIBRARY,
      assets: STUDIO_ASSET_LIBRARY,
      modules: STUDIO_MODULE_REGISTRY,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = saveSchema.parse(await request.json());

    if (body.action === "export") {
      const draft = await getPlatformVisualDraft();
      return NextResponse.json({ ok: true, bundle: draft });
    }

    if (body.action === "publish") {
      const published = await publishPlatformVisualTheme(auth.user.id);
      const [live, history] = await Promise.all([
        getPlatformVisualConfig({ mode: "live" }),
        getPlatformVisualHistory(),
      ]);
      return NextResponse.json({ ok: true, published, live, history });
    }

    if (body.action === "rollback") {
      if (!body.historyId) {
        return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      }
      const restored = await rollbackPlatformVisualTheme(body.historyId, auth.user.id);
      const [live, history, draft] = await Promise.all([
        getPlatformVisualConfig({ mode: "live" }),
        getPlatformVisualHistory(),
        getPlatformVisualDraft(),
      ]);
      return NextResponse.json({ ok: true, restored, live, history, draft });
    }

    if (body.action === "duplicate") {
      const duplicate = await duplicatePlatformVisualTheme(auth.user.id);
      return NextResponse.json({ ok: true, draft: duplicate });
    }

    if (body.action === "reset-draft") {
      const draft = await resetPlatformVisualDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "import") {
      if (!body.bundle) {
        return NextResponse.json({ error: "bundle is required." }, { status: 400 });
      }
      const saved = await savePlatformVisualDraft(body.bundle as PlatformVisualBundle, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.bundle) {
        return NextResponse.json({ error: "bundle is required." }, { status: 400 });
      }
      const saved = await savePlatformVisualDraft(body.bundle as PlatformVisualBundle, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update platform visual settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
