import { NextResponse } from "next/server";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getSellerMigrationSummary } from "@/lib/seller/migration/repository-summary";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ summary: null });
  }

  const summary = await getSellerMigrationSummary(auth.user.id);
  return NextResponse.json({ summary });
}
