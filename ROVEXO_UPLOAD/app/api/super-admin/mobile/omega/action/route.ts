import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  acknowledgeOmegaAlert,
  executeOmegaEnterpriseAction,
  resolveOmegaAlert,
} from "@/lib/omega-enterprise-mobile-engine/engine";
import { getOmegaEnterpriseMobileSnapshot } from "@/lib/omega-enterprise-mobile-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum([
    "run-scan",
    "verify-integrity",
    "restart-services",
    "clear-cache",
    "generate-report",
    "verify-certificates",
    "sync-data",
    "refresh-status",
    "emergency-mode",
    "maintenance-mode",
    "acknowledge-alert",
    "resolve-alert",
  ]),
  reportType: z.string().optional(),
  format: z.enum(["pdf", "csv", "xlsx"]).optional(),
  alertId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { action, reportType, format, alertId } = parsed.data;

  try {
    if (action === "acknowledge-alert") {
      if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });
      await acknowledgeOmegaAlert(alertId, auth.user.id);
    } else if (action === "resolve-alert") {
      if (!alertId) return NextResponse.json({ error: "alertId required" }, { status: 400 });
      await resolveOmegaAlert(alertId, auth.user.id);
    } else {
      await executeOmegaEnterpriseAction(action, auth.user.id, { reportType, format });
    }

    const snapshot = await getOmegaEnterpriseMobileSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
