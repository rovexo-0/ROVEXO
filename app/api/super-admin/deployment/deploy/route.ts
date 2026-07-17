import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeDeploymentAction } from "@/lib/enterprise-deployment-center/actions";
import { getDeploymentSnapshot } from "@/lib/enterprise-deployment-center/reader";
import { assertFullDemoCertificationPassed } from "@/lib/full-demo/deploy-gate";
import { assertDeploymentCertificationPassed } from "@/lib/full-demo/deployment-certification";
import { assertReleaseProtectionNoOverride } from "@/lib/full-demo/no-override";

export const dynamic = "force-dynamic";

/** Strict schema — unknown override keys are rejected by Zod + no-override contract. */
const bodySchema = z
  .object({
    releaseId: z.string().optional(),
    strategy: z.string().optional(),
    mfaVerified: z.boolean().optional(),
  })
  .strict();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    assertReleaseProtectionNoOverride({ payload: raw });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Override forbidden." },
      { status: 403 },
    );
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deploy request." }, { status: 400 });
  }
  if (parsed.data.mfaVerified !== true) {
    return NextResponse.json({ error: "MFA verification is required before deploy." }, { status: 403 });
  }

  try {
    assertFullDemoCertificationPassed();
    assertDeploymentCertificationPassed();
    const result = await executeDeploymentAction("deploy", auth.user.id, parsed.data);
    const deploymentCenter = await getDeploymentSnapshot("builds");
    return NextResponse.json({ ok: true, ...result, deploymentCenter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Deploy failed" }, { status: 400 });
  }
}
