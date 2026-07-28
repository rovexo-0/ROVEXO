import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  forceRecalculateSellerPerformance,
  getSellerPerformanceAnalyticsSummary,
  getSellerPerformanceDashboard,
  listSellerPerformanceAudit,
} from "@/lib/seller-performance/service";
import { BADGE_CATALOG, type BadgeId } from "@/lib/badge/badge-engine-v1";
import { applyBadgeEmergencyOverride } from "@/lib/badge/store";

function clientIp(request: Request): string | undefined {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
}

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, "admin-seller-performance", 60, 60_000);
  if (limited) return limited;

  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? undefined;

  const [summary, audit, dashboard] = await Promise.all([
    getSellerPerformanceAnalyticsSummary(),
    listSellerPerformanceAudit(userId, 50),
    userId ? getSellerPerformanceDashboard(userId) : Promise.resolve(null),
  ]);

  return NextResponse.json({ summary, audit, dashboard });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "admin-seller-performance-write", 30, 60_000);
  if (limited) return limited;

  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    action: "force_recalc" | "grant_badge" | "revoke_badge";
    userId: string;
    reason: string;
    badgeId?: string;
  };

  if (!body.userId || !body.reason?.trim()) {
    return NextResponse.json({ error: "userId and reason are required" }, { status: 400 });
  }

  const ipAddress = clientIp(request);

  if (body.action === "force_recalc") {
    const score = await forceRecalculateSellerPerformance(
      body.userId,
      auth.user.id,
      body.reason,
      ipAddress,
    );
    return NextResponse.json({ success: true, score });
  }

  // P0: badge grant/revoke redirects to Badge Engine (seller-performance never publishes badges).
  if (body.action === "grant_badge" || body.action === "revoke_badge") {
    if (!body.badgeId || !(body.badgeId in BADGE_CATALOG)) {
      return NextResponse.json(
        {
          error:
            "Use Badge Engine badge ids. Canonical write API: POST /api/admin/badges",
          canonicalApi: "/api/admin/badges",
        },
        { status: 400 },
      );
    }

    const result = await applyBadgeEmergencyOverride({
      userId: body.userId,
      badgeId: body.badgeId as BadgeId,
      action: body.action === "grant_badge" ? "force_enable" : "force_disable",
      reason: body.reason,
      actorId: auth.user.id,
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, canonicalApi: "/api/admin/badges" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      redirectedTo: "badge-engine-v1",
      canonicalApi: "/api/admin/badges",
      deprecated: true,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
