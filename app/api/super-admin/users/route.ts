import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getSuperAdminUser, listSuperAdminUsers } from "@/lib/super-admin/users";
import { getUserManagementInsights, setUserAdminNote } from "@/lib/super-admin/insights";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const detailId = searchParams.get("detail");

  if (detailId) {
    const [user, insights] = await Promise.all([
      getSuperAdminUser(detailId),
      getUserManagementInsights(detailId),
    ]);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ user, insights });
  }

  const users = await listSuperAdminUsers({
    query: searchParams.get("q") ?? undefined,
    role: (searchParams.get("role") as never) ?? "all",
    status: (searchParams.get("status") as never) ?? "all",
    limit: Number(searchParams.get("limit") ?? 100),
  });

  return NextResponse.json({ users });
}

const patchSchema = z.object({
  userId: z.string().uuid().optional(),
  userIds: z.array(z.string().uuid()).optional(),
  action: z.enum([
    "suspend",
    "unsuspend",
    "delete",
    "restore",
    "verify",
    "unverify",
    "set_role",
    "set_entitlements",
    "set_listing_limit",
    "set_vacation_mode",
    "reset_password",
    "admin_note",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = patchSchema.parse(await request.json());

    if (body.action === "admin_note") {
      if (!body.userId) {
        return NextResponse.json({ error: "User ID is required." }, { status: 400 });
      }
      await setUserAdminNote({
        actorId: auth.user.id,
        userId: body.userId,
        note: String(body.payload?.note ?? ""),
      });
      return NextResponse.json({ ok: true });
    }

    const targetIds = body.userIds?.length ? body.userIds : body.userId ? [body.userId] : [];
    if (!targetIds.length) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const { updateSuperAdminUser } = await import("@/lib/super-admin/users");
    const results = [];

    for (const userId of targetIds) {
      const user = await updateSuperAdminUser({
        actorId: auth.user.id,
        userId,
        action: body.action,
        payload: body.payload,
      });
      results.push(user);
    }

    return NextResponse.json({ users: results, count: results.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update user.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
