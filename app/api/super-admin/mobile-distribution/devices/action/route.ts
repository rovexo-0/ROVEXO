import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeDeviceRemoteAction } from "@/lib/device-lifecycle-manager-engine/engine";
import { getDeviceLifecycleManagerSnapshot } from "@/lib/device-lifecycle-manager-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum([
    "remote-logout",
    "remote-lock",
    "force-update",
    "revoke",
    "remove",
    "rename",
    "clear-cache",
    "reset-biometric",
    "invalidate-sessions",
    "generate-report",
    "trust",
  ]),
  deviceId: z.string().min(1),
  name: z.string().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { action, deviceId, name } = parsed.data;

  try {
    if (action === "rename" && !name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    await executeDeviceRemoteAction(action, deviceId, auth.user.id, { name });
    const snapshot = await getDeviceLifecycleManagerSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
