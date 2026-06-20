import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/session";
import { createConnectAccountLink } from "@/lib/stripe/connect";

export async function POST() {
  const auth = await requireApiRole(["seller", "business", "admin"]);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const result = await createConnectAccountLink(auth.user.id);
  if ("error" in result) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, url: result.url });
}
