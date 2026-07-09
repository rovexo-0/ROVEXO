import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { runSeoRegressionSuite } from "@/lib/seo/engine/regression";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const report = runSeoRegressionSuite();
  return NextResponse.json(
    { report },
    { status: report.passed ? 200 : 422 },
  );
}
