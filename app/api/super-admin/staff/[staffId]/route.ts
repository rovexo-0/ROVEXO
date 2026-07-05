import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  assignStaffRole,
  forceStaffLogout,
  getStaffProfileDetail,
  listStaffActivity,
  listStaffLoginHistory,
  listStaffPermissionHistory,
  removeStaffRole,
  resetStaffPassword,
  toStaffActionContext,
  updateStaffProfileFields,
  updateStaffStatus,
} from "@/lib/staff-profile";
import type { StaffRoleId } from "@/lib/staff-profile";

type RouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { staffId } = await context.params;
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  const staff = await getStaffProfileDetail(staffId);
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  if (section === "activity") {
    const activity = await listStaffActivity(staffId, {
      module: (searchParams.get("module") as never) ?? "all",
      limit: Number(searchParams.get("limit") ?? 50),
      offset: Number(searchParams.get("offset") ?? 0),
    });
    return NextResponse.json({ staff, activity });
  }

  if (section === "login-history") {
    const loginHistory = await listStaffLoginHistory(
      staffId,
      Number(searchParams.get("limit") ?? 50),
      Number(searchParams.get("offset") ?? 0),
    );
    return NextResponse.json({ staff, loginHistory });
  }

  if (section === "permissions") {
    const permissionHistory = await listStaffPermissionHistory(
      staffId,
      Number(searchParams.get("limit") ?? 50),
      Number(searchParams.get("offset") ?? 0),
    );
    return NextResponse.json({ staff, permissionHistory });
  }

  const [activity, loginHistory, permissionHistory] = await Promise.all([
    listStaffActivity(staffId, { limit: 20 }),
    listStaffLoginHistory(staffId, 20),
    listStaffPermissionHistory(staffId, 20),
  ]);

  return NextResponse.json({ staff, activity, loginHistory, permissionHistory });
}

const patchSchema = z.object({
  action: z.enum([
    "assign_role",
    "remove_role",
    "suspend",
    "reactivate",
    "archive",
    "reset_password",
    "force_logout",
    "update_profile",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { staffId } = await context.params;
  const staff = await getStaffProfileDetail(staffId);
  if (!staff) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await request.json());
    const actionContext = toStaffActionContext(auth.user.id, request);

    switch (body.action) {
      case "assign_role": {
        const roleId = String(body.payload?.roleId ?? "") as StaffRoleId;
        if (!roleId) return NextResponse.json({ error: "roleId is required." }, { status: 400 });
        await assignStaffRole(staffId, roleId, actionContext);
        break;
      }
      case "remove_role": {
        const roleId = String(body.payload?.roleId ?? "") as StaffRoleId;
        if (!roleId) return NextResponse.json({ error: "roleId is required." }, { status: 400 });
        await removeStaffRole(staffId, roleId, actionContext);
        break;
      }
      case "suspend":
        await updateStaffStatus(staffId, "suspended", actionContext);
        break;
      case "reactivate":
        await updateStaffStatus(staffId, "active", actionContext);
        break;
      case "archive":
        await updateStaffStatus(staffId, "archived", actionContext);
        break;
      case "reset_password":
        await resetStaffPassword(staffId, actionContext);
        break;
      case "force_logout":
        await forceStaffLogout(staffId, actionContext);
        break;
      case "update_profile":
        await updateStaffProfileFields(
          staffId,
          {
            firstName: body.payload?.firstName ? String(body.payload.firstName) : undefined,
            lastName: body.payload?.lastName ? String(body.payload.lastName) : undefined,
            personalEmail: body.payload?.personalEmail ? String(body.payload.personalEmail) : undefined,
            phoneNumber:
              body.payload?.phoneNumber === undefined
                ? undefined
                : body.payload?.phoneNumber
                  ? String(body.payload.phoneNumber)
                  : null,
          },
          actionContext,
        );
        break;
    }

    const updated = await getStaffProfileDetail(staffId);
    return NextResponse.json({ ok: true, staff: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Staff action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
