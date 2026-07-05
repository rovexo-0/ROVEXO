import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff, requireApiSuperAdmin } from "@/lib/auth/session";
import { toStaffActionContext } from "@/lib/staff-profile";
import { registerStaffDevice } from "@/lib/staff-enterprise/directory";
import { createAdminClient } from "@/lib/supabase/admin";
import { forceStaffLogout, updateStaffStatus, assignStaffRole, removeStaffRole } from "@/lib/staff-profile";

const actionSchema = z.object({
  action: z.enum([
    "register_device",
    "block_device",
    "trust_device",
    "remote_logout",
    "assign_role",
    "remove_role",
    "suspend_staff",
    "reactivate_staff",
  ]),
  staffId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
  roleId: z.string().optional(),
  platform: z.enum(["android", "ios", "windows", "macos", "web", "browser"]).optional(),
  deviceName: z.string().optional(),
  pushToken: z.string().optional(),
});

const STAFF_SELF_ACTIONS = new Set(["register_device"]);

export async function POST(request: Request) {
  try {
    const body = actionSchema.parse(await request.json());

    if (STAFF_SELF_ACTIONS.has(body.action)) {
      const auth = await requireApiStaff(request);
      if (auth instanceof NextResponse) return auth;

      const context = toStaffActionContext(auth.user.id, request);
      const admin = createAdminClient();

      if (!body.platform || !body.deviceName) {
        return NextResponse.json({ error: "platform and deviceName required." }, { status: 400 });
      }

      const deviceId = await registerStaffDevice({
        staffId: auth.staffId,
        profileId: auth.user.id,
        platform: body.platform,
        deviceName: body.deviceName,
        userAgent: request.headers.get("user-agent"),
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        trusted: false,
        context,
      });

      if (body.pushToken) {
        await admin
          .from("staff_registered_devices" as never)
          .update({ push_token: body.pushToken, push_platform: body.platform } as never)
          .eq("id", deviceId);
      }

      return NextResponse.json({ deviceId });
    }

    const auth = await requireApiSuperAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const context = toStaffActionContext(auth.user.id, request);
    const admin = createAdminClient();

    if (!body.staffId) {
      return NextResponse.json({ error: "staffId required for admin actions." }, { status: 400 });
    }

    switch (body.action) {
      case "block_device":
        if (!body.deviceId) return NextResponse.json({ error: "deviceId required." }, { status: 400 });
        await admin.from("staff_registered_devices" as never).update({ blocked: true } as never).eq("id", body.deviceId);
        break;
      case "trust_device":
        if (!body.deviceId) return NextResponse.json({ error: "deviceId required." }, { status: 400 });
        await admin.from("staff_registered_devices" as never).update({ trusted: true } as never).eq("id", body.deviceId);
        break;
      case "remote_logout":
        await forceStaffLogout(body.staffId, context);
        break;
      case "assign_role":
        if (!body.roleId) return NextResponse.json({ error: "roleId required." }, { status: 400 });
        await assignStaffRole(body.staffId, body.roleId as never, context);
        break;
      case "remove_role":
        if (!body.roleId) return NextResponse.json({ error: "roleId required." }, { status: 400 });
        await removeStaffRole(body.staffId, body.roleId as never, context);
        break;
      case "suspend_staff":
        await updateStaffStatus(body.staffId, "suspended", context);
        break;
      case "reactivate_staff":
        await updateStaffStatus(body.staffId, "active", context);
        break;
      default:
        return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Action failed." },
      { status: 400 },
    );
  }
}
