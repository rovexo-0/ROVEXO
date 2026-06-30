import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getCategoryManagementSnapshot } from "@/lib/enterprise-category-management-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  let dbCategories;
  try {
    const { listAdminCategories } = await import("@/lib/categories/admin");
    dbCategories = await listAdminCategories();
  } catch {
    dbCategories = undefined;
  }
  const categoryManagement = await getCategoryManagementSnapshot("dashboard", dbCategories);
  return NextResponse.json({ categoryManagement });
}
