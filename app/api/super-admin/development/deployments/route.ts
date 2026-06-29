import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeDevelopmentAction } from "@/lib/enterprise-development-center/actions";
import { getDevelopmentSnapshot } from "@/lib/enterprise-development-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const development = await getDevelopmentSnapshot();
  return NextResponse.json({ releases: development.releases });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const body = await request.json().catch(() => ({}));
  try {
    const action = "deploy";
    const result = await executeDevelopmentAction(action, auth.user.id, { ...body, mfaVerified: true });
    const development = await getDevelopmentSnapshot();
    return NextResponse.json({ ok: true, ...result, development });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
