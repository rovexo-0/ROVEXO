import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import { updatePlatformSetting } from "@/lib/super-admin/settings";
import { updateAiOperationsSettings } from "@/lib/super-admin/operations/snapshot";

const bodySchema = z.object({
  action: z.enum([
    "restart_services",
    "restart_queue",
    "clear_cache",
    "reload_configuration",
    "maintenance_on",
    "maintenance_off",
    "emergency_diagnostics",
  ]),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = bodySchema.parse(await request.json());

  await auditSuperAdminAction({
    actorId: auth.user.id,
    action: `ai_operations.emergency.${body.action}`,
    resourceType: "platform",
    metadata: { message: body.message },
  });

  switch (body.action) {
    case "clear_cache":
      revalidatePath("/", "layout");
      break;
    case "reload_configuration":
      await updateAiOperationsSettings(auth.user.id, { lastScanAt: new Date().toISOString() });
      break;
    case "maintenance_on":
      await updatePlatformSetting({
        actorId: auth.user.id,
        key: "maintenance_mode",
        value: {
          enabled: true,
          message: body.message ?? "ROVEXO is undergoing emergency maintenance.",
        },
      });
      break;
    case "maintenance_off":
      await updatePlatformSetting({
        actorId: auth.user.id,
        key: "maintenance_mode",
        value: {
          enabled: false,
          message: "",
        },
      });
      break;
    case "emergency_diagnostics": {
      const { runAiOperationsScan } = await import("@/lib/super-admin/operations/snapshot");
      const snapshot = await runAiOperationsScan(auth.user.id);
      return NextResponse.json({
        ok: true,
        message: "Emergency diagnostics completed.",
        summary: snapshot.summary,
      });
    }
    default:
      break;
  }

  return NextResponse.json({
    ok: true,
    message: `Emergency action "${body.action}" recorded.`,
  });
}
