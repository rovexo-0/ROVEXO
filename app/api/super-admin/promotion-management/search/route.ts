import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { searchPromotionUsers } from "@/lib/promotions/admin-engine";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const results = await searchPromotionUsers(q);
  return NextResponse.json({ results });
}
