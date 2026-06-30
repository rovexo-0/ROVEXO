import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { listPlatformSettings, updatePlatformSetting } from "@/lib/super-admin/settings";
import type { Json } from "@/lib/supabase/types/database";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const settings = await listPlatformSettings();
  return NextResponse.json({ settings });
}

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.record(z.string(), z.unknown()),
});

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = patchSchema.parse(await request.json());
    await updatePlatformSetting({
      actorId: auth.user.id,
      key: body.key,
      value: body.value as Json,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update settings.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
