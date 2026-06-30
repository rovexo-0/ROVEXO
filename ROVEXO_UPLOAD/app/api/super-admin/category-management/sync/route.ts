import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeCategoryManagementAction } from "@/lib/enterprise-category-management-center/actions";
import { getCategoryManagementSnapshot } from "@/lib/enterprise-category-management-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const action = parsed.data.action ?? "sync";
  try {
    const result = await executeCategoryManagementAction(action, auth.user.id, parsed.data);
    let dbCategories;
    try {
      const { listAdminCategories } = await import("@/lib/categories/admin");
      dbCategories = await listAdminCategories();
    } catch {
      dbCategories = undefined;
    }
    const categoryManagement = await getCategoryManagementSnapshot("dashboard", dbCategories);
    return NextResponse.json({ ok: true, ...result, categoryManagement });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
