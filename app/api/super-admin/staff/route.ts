import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  createStaffProfile,
  ensureSuperAdminStaffProfile,
  listStaffProfiles,
  listStaffRoleCatalog,
  toStaffActionContext,
} from "@/lib/staff-profile";

const createSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  personalEmail: z.string().email(),
  phoneNumber: z.string().max(40).optional().nullable(),
  profileId: z.string().uuid().optional().nullable(),
  roleIds: z
    .array(
      z.enum([
        "administrator",
        "support",
        "marketplace_moderator",
        "finance",
        "shipping",
        "business",
        "content_manager",
      ]),
    )
    .optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const staff = await listStaffProfiles({
    query: searchParams.get("q") ?? undefined,
    status: (searchParams.get("status") as never) ?? "all",
    role: (searchParams.get("role") as never) ?? "all",
    sort: (searchParams.get("sort") as never) ?? "alphabetical",
    limit: Number(searchParams.get("limit") ?? 100),
    offset: Number(searchParams.get("offset") ?? 0),
  });
  const roles = await listStaffRoleCatalog();

  return NextResponse.json({ staff, roles });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = createSchema.parse(await request.json());
    const context = toStaffActionContext(auth.user.id, request);
    const staff = await createStaffProfile(body, context);
    return NextResponse.json({ staff }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create staff profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const context = toStaffActionContext(auth.user.id, request);
  await ensureSuperAdminStaffProfile(context);
  return NextResponse.json({ ok: true });
}
