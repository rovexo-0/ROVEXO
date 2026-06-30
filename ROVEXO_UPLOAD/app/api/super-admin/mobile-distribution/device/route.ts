import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  blockMobileDevice,
  removeMobileDevice,
  renameMobileDevice,
  remoteLogoutMobileDevice,
  trustMobileDevice,
} from "@/lib/mobile-distribution-center-engine/engine";
import { getMobileDistributionCenterEngineSnapshot } from "@/lib/mobile-distribution-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["remove", "rename", "remote-logout", "block", "trust"]),
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
    if (action === "remove") await removeMobileDevice(deviceId, auth.user.id);
    else if (action === "rename") {
      if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      await renameMobileDevice(deviceId, name, auth.user.id);
    } else if (action === "block") await blockMobileDevice(deviceId, auth.user.id);
    else if (action === "trust") await trustMobileDevice(deviceId, auth.user.id);
    else await remoteLogoutMobileDevice(deviceId, auth.user.id);

    const snapshot = await getMobileDistributionCenterEngineSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Device action failed" }, { status: 400 });
  }
}
