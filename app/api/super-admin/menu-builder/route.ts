import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { updatePlatformSetting } from "@/lib/super-admin/settings";
import { auditVisualChange } from "@/lib/platform-visual/audit";
import { PLATFORM_VISUAL_MENUS_KEY } from "@/lib/platform-visual/keys";
import type { Json } from "@/lib/supabase/types/database";
import type { MenuBuilderConfig } from "@/lib/platform-visual/types";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  menus: z.record(z.string(), z.unknown()),
});

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = patchSchema.parse(await request.json());
    await updatePlatformSetting({
      actorId: auth.user.id,
      key: PLATFORM_VISUAL_MENUS_KEY,
      value: body.menus as Json,
    });
    await auditVisualChange({
      actorId: auth.user.id,
      module: "menu-builder",
      action: "publish",
      newValue: { version: (body.menus as MenuBuilderConfig).version },
      rollbackAvailable: true,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save menus.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
