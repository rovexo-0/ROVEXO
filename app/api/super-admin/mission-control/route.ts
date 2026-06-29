import { NextResponse } from "next/server";

import { z } from "zod";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { auditVisualChange } from "@/lib/platform-visual/audit";
import {

  AI_MANAGER_SETTING_KEY,

  BANNER_MANAGER_SETTING_KEY,

  FEATURE_MANAGER_SETTING_KEY,

  HOMEPAGE_BUILDER_SETTING_KEY,

} from "@/lib/super-admin/mission-control/defaults";

import { getMissionControlSnapshot, saveMissionControlSetting } from "@/lib/super-admin/mission-control/snapshot";



export const dynamic = "force-dynamic";



const patchSchema = z.object({

  scope: z.enum(["homepage-builder", "banners", "features", "ai"]),

  value: z.unknown(),

});



export async function GET() {

  const auth = await requireApiSuperAdmin();

  if (auth instanceof NextResponse) return auth;



  const snapshot = await getMissionControlSnapshot();

  return NextResponse.json({ snapshot });

}



export async function PATCH(request: Request) {

  const auth = await requireApiSuperAdmin();

  if (auth instanceof NextResponse) return auth;



  try {

    const body = patchSchema.parse(await request.json());

    const key =

      body.scope === "homepage-builder"

        ? HOMEPAGE_BUILDER_SETTING_KEY

        : body.scope === "banners"

          ? BANNER_MANAGER_SETTING_KEY

          : body.scope === "features"

            ? FEATURE_MANAGER_SETTING_KEY

            : AI_MANAGER_SETTING_KEY;



    await saveMissionControlSetting(key, body.value, auth.user.id);
    await auditVisualChange({
      actorId: auth.user.id,
      module: body.scope,
      action: "publish",
      newValue: body.value,
      rollbackAvailable: true,
    });

    const snapshot = await getMissionControlSnapshot();

    return NextResponse.json({ ok: true, snapshot });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Unable to update Mission Control settings.";

    return NextResponse.json({ error: message }, { status: 400 });

  }

}

