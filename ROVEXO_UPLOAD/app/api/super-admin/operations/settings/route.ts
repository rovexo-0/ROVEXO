import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { updateAiOperationsSettings } from "@/lib/super-admin/operations/snapshot";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

const bodySchema = z.object({
  autoRepairEnabled: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = bodySchema.parse(await request.json());
  const settings = await updateAiOperationsSettings(auth.user.id, body);

  await auditSuperAdminAction({
    actorId: auth.user.id,
    action: "ai_operations.settings",
    resourceType: "platform_settings",
    resourceId: "ai_operations_settings",
    metadata: body,
  });

  return NextResponse.json({ settings });
}
