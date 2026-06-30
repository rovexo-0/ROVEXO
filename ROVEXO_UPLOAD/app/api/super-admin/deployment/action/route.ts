import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeDeploymentAction } from "@/lib/enterprise-deployment-center/actions";
import { getDeploymentSnapshot } from "@/lib/enterprise-deployment-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.string().min(1),
  mfaVerified: z.boolean().optional(),
}).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    await executeDeploymentAction(parsed.data.action, auth.user.id, parsed.data);
    const deploymentCenter = await getDeploymentSnapshot();
    return NextResponse.json({ ok: true, deploymentCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
