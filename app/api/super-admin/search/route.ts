import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runSuperAdminGlobalSearch } from "@/lib/super-admin/search";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await runSuperAdminGlobalSearch(q);
  return NextResponse.json({ results });
}
