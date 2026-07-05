import { NextResponse } from "next/server";
import { requireApiStaff } from "@/lib/auth/session";
import { toStaffActionContext } from "@/lib/staff-profile";
import {
  listStaffDirectory,
  listStaffChannels,
  resolveStaffDashboardModules,
  touchStaffPresence,
} from "@/lib/staff-enterprise";

export async function GET() {
  const auth = await requireApiStaff();
  if (auth instanceof NextResponse) return auth;

  const [modules, directory, channels] = await Promise.all([
    resolveStaffDashboardModules(auth.staffId),
    listStaffDirectory(100),
    listStaffChannels(auth.staffId),
  ]);

  return NextResponse.json({
    staffId: auth.staffId,
    roleIds: auth.staffRoleIds,
    modules,
    directory,
    channels,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiStaff(request);
  if (auth instanceof NextResponse) return auth;

  toStaffActionContext(auth.user.id, request);
  await touchStaffPresence(auth.staffId);

  return NextResponse.json({ ok: true, presence: "online" });
}
