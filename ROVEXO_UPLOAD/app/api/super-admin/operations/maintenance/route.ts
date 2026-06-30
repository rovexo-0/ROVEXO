import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { setOperationsMaintenance } from "@/lib/operations-center-engine/engine";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  enabled: z.boolean(),
  message: z.string().optional(),
  mode: z.enum(["scheduled", "emergency", "disabled"]).optional(),
  whitelistAdmin: z.boolean().optional(),
  countdownSeconds: z.number().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const maintenance = await setOperationsMaintenance(body, auth.user.id);
    return NextResponse.json({ ok: true, maintenance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update maintenance.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
