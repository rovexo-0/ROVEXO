import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  createDemoCertificationSession,
  destroyDemoCertificationSession,
} from "@/lib/full-demo/demo-session-engine-v1";
import { tryCreateAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function assertStaff(userId: string): Promise<boolean> {
  const admin = tryCreateAdminClient();
  if (!admin) return false;
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const role = data?.role;
  return role === "admin" || role === "super_admin";
}

/** POST — create isolated XLIV demo certification session (staff / service only). */
export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const staff = await assertStaff(auth.user.id);
  const serviceHeader = request.headers.get("x-rovexo-demo-session-key");
  const serviceOk =
    Boolean(process.env.ROVEXO_DEMO_SESSION_KEY) &&
    serviceHeader === process.env.ROVEXO_DEMO_SESSION_KEY;

  if (!staff && !serviceOk) {
    return NextResponse.json(
      { success: false, error: "Permission denied.", code: "PERMISSION_DENIED", bloodLaw: "XLIV" },
      { status: 403 },
    );
  }

  let maxListings = 10;
  try {
    const body = (await request.json()) as { maxListings?: number };
    if (typeof body.maxListings === "number") maxListings = body.maxListings;
  } catch {
    // empty body ok
  }

  const result = await createDemoCertificationSession({ maxListings });
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.message, code: result.code, bloodLaw: "XLIV" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, bloodLaw: "XLIV", session: result });
}

/** DELETE — destroy session, restore wallets, fail closed if production changed. */
export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const staff = await assertStaff(auth.user.id);
  const serviceHeader = request.headers.get("x-rovexo-demo-session-key");
  const serviceOk =
    Boolean(process.env.ROVEXO_DEMO_SESSION_KEY) &&
    serviceHeader === process.env.ROVEXO_DEMO_SESSION_KEY;

  if (!staff && !serviceOk) {
    return NextResponse.json(
      { success: false, error: "Permission denied.", code: "PERMISSION_DENIED", bloodLaw: "XLIV" },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "sessionId required.", code: "INVALID_INPUT", bloodLaw: "XLIV" },
      { status: 400 },
    );
  }

  const result = await destroyDemoCertificationSession(sessionId);
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.message,
        code: result.code,
        bloodLaw: "XLIV",
        fingerprintBefore: result.fingerprintBefore,
        fingerprintAfter: result.fingerprintAfter,
      },
      { status: result.code === "PRODUCTION_MUTATION_DETECTED" ? 409 : 500 },
    );
  }

  return NextResponse.json({ success: true, bloodLaw: "XLIV", destroy: result });
}
