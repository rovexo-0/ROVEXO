import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { setRecoverySafeMode } from "@/lib/recovery-center-engine/engine";
import { getRecoveryCenterEngineSnapshot } from "@/lib/recovery-center-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  readOnlyMarketplace: z.boolean().optional(),
  disablePublishing: z.boolean().optional(),
  disableAdminEditing: z.boolean().optional(),
  disableIntegrations: z.boolean().optional(),
  disableScheduledJobs: z.boolean().optional(),
  disableAi: z.boolean().optional(),
  disableExternalApis: z.boolean().optional(),
  emergencyHomepage: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const safeMode = await setRecoverySafeMode(body, auth.user.id);
    const snapshot = await getRecoveryCenterEngineSnapshot();
    return NextResponse.json({ ok: true, safeMode, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update safe mode.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
