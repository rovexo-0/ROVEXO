import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  confirmDeploymentReadiness,
  rebuildProductionAssets,
  runProductionAssetValidation,
} from "@/lib/super-admin/production-assets/actions";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["validate", "rebuild", "deploy"]),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const result = await runProductionAssetValidation();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
  }

  const result =
    parsed.data.action === "validate"
      ? await runProductionAssetValidation()
      : parsed.data.action === "rebuild"
        ? await rebuildProductionAssets()
        : await confirmDeploymentReadiness();

  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
