import { NextResponse } from "next/server";
import {
  getBusinessAnalyticsData,
  getSellerAnalyticsData,
} from "@/lib/analytics/store";
import type { AnalyticsDateRange } from "@/lib/analytics/types";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";

function parseRange(value: string | null): AnalyticsDateRange {
  if (value === "7d" || value === "30d" || value === "90d" || value === "1y") return value;
  return "30d";
}

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const range = parseRange(searchParams.get("range"));

  if (type === "business") {
    const roleCheck = await requireApiRole(["business", "admin"]);
    if (roleCheck instanceof NextResponse) {
      return roleCheck;
    }
    const data = await getBusinessAnalyticsData(auth.user.id, range);
    return NextResponse.json({ data });
  }

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) {
    return roleCheck;
  }

  const data = await getSellerAnalyticsData(auth.user.id, range);
  return NextResponse.json({ data });
}
