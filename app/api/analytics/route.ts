import { NextResponse } from "next/server";
import {
  getBusinessAnalyticsData,
  getSellerAnalyticsData,
} from "@/lib/analytics/store";
import {
  isBusinessAnalyticsPeriodId,
  type BusinessAnalyticsPeriodId,
} from "@/lib/analytics/business-analytics-v1";
import type { AnalyticsDateRange } from "@/lib/analytics/types";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { loadBusinessStatus } from "@/lib/business/business-onboarding-v1";
import { normalizeSellerContext } from "@/lib/seller-context/seller-context-v1";

function parseSellerRange(value: string | null): AnalyticsDateRange {
  if (value === "7d" || value === "30d" || value === "90d" || value === "1y") return value;
  return "30d";
}

function parseBusinessPeriod(value: string | null): BusinessAnalyticsPeriodId {
  return isBusinessAnalyticsPeriodId(value) ? value : "30d";
}

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "business") {
    const status = await loadBusinessStatus(auth.user.id, { lite: true });
    if (!status.stripe.verified) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (normalizeSellerContext(status.activeSellerContext) !== "business") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const period = parseBusinessPeriod(searchParams.get("period") ?? searchParams.get("range"));
    const data = await getBusinessAnalyticsData(auth.user.id, period, {
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });
    return NextResponse.json({ data });
  }

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) {
    return roleCheck;
  }

  const data = await getSellerAnalyticsData(auth.user.id, parseSellerRange(searchParams.get("range")));
  return NextResponse.json({ data });
}
