import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { syncEnterpriseTaxonomyToDatabase } from "@/lib/categories/sync-db";

export async function POST() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const result = await syncEnterpriseTaxonomyToDatabase();
  return NextResponse.json(result);
}
