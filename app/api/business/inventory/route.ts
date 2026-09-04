import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { getInventoryOverview, listInventoryItems } from "@/lib/business/inventory";
import { loadBusinessStatus } from "@/lib/business/business-onboarding-v1";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) return auth;

  const status = await loadBusinessStatus(auth.user.id);
  if (!status.stripe.verified) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (status.activeSellerContext !== "business") {
    return NextResponse.json({ error: "Business context required." }, { status: 403 });
  }

  try {
    const [overview, items] = await Promise.all([
      getInventoryOverview(auth.user.id),
      listInventoryItems(auth.user.id),
    ]);
    return NextResponse.json({ overview, items, productCount: items.length });
  } catch {
    return NextResponse.json({ error: "Unable to load inventory." }, { status: 500 });
  }
}
