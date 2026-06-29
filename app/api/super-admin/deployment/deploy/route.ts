import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeDeploymentAction } from "@/lib/enterprise-deployment-center/actions";
import { getDeploymentSnapshot } from "@/lib/enterprise-deployment-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  releaseId: z.string().optional(),
  strategy: z.string().optional(),
  mfaVerified: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));

  try {
    const result = await executeDeploymentAction("deploy", auth.user.id, { ...parsed.data, mfaVerified: true });
    const deploymentCenter = await getDeploymentSnapshot("builds");
    return NextResponse.json({ ok: true, ...result, deploymentCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Deploy failed" }, { status: 400 });
  }
}
