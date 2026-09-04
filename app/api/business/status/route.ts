import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { loadBusinessStatus } from "@/lib/business/business-onboarding-v1";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";

  try {
    const status = await loadBusinessStatus(auth.user.id, { refresh });
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ error: "Unable to load business status." }, { status: 500 });
  }
}
