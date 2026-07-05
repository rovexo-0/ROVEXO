import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  applyGlobalIconReplace,
  getXosSnapshot,
  runFullXosRescan,
  runDesignStudioAudit,
  runAiExperienceGuardian,
  searchVisualAssets,
} from "@/lib/design-studio-v1";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["audit", "rescan", "replace-global", "guardian-fix", "publish", "rollback"]),
  historyId: z.string().optional(),
  query: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("search");

  if (searchQuery) {
    const results = searchVisualAssets({ query: searchQuery, limit: 40 });
    return NextResponse.json({ ok: true, results });
  }

  if (url.searchParams.get("rescan") === "1") {
    const rescan = await runFullXosRescan();
    return NextResponse.json({ ok: true, ...rescan });
  }

  const snapshot = await getXosSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "audit") {
      const designAudit = runDesignStudioAudit();
      const experienceGuardian = runAiExperienceGuardian();
      return NextResponse.json({ ok: true, designAudit, experienceGuardian });
    }

    if (body.action === "rescan") {
      const rescan = await runFullXosRescan();
      return NextResponse.json({ ok: true, ...rescan });
    }

    if (body.action === "replace-global" || body.action === "guardian-fix") {
      applyGlobalIconReplace({ apply: true });
      const rescan = await runFullXosRescan();
      return NextResponse.json({ ok: true, ...rescan });
    }

    if (body.action === "publish") {
      const { publishPlatformVisualTheme } = await import("@/lib/platform-visual/theme-engine");
      const published = await publishPlatformVisualTheme(auth.user.id);
      const snapshot = await getXosSnapshot();
      return NextResponse.json({ ok: true, published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) {
        return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      }
      const { rollbackPlatformVisualTheme } = await import("@/lib/platform-visual/theme-engine");
      const restored = await rollbackPlatformVisualTheme(body.historyId, auth.user.id);
      const snapshot = await getXosSnapshot();
      return NextResponse.json({ ok: true, restored, snapshot });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Design Studio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
