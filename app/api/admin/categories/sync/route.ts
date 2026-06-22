import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { syncEnterpriseTaxonomyToDatabase } from "@/lib/categories/sync-db";

export async function POST() {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  const result = await syncEnterpriseTaxonomyToDatabase();
  return NextResponse.json(result);
}
