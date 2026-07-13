import { enforceRateLimit } from "@/lib/api/rate-limit";
import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  forceRecalculateSellerPerformance,
  getSellerPerformanceAnalyticsSummary,
  getSellerPerformanceDashboard,
  grantSellerPerformanceBadge,
  listSellerPerformanceAudit,
  revokeSellerPerformanceBadge,
} from "@/lib/seller-performance/service";
import type { AchievementId } from "@/lib/seller-performance/master-spec";

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
    badgeId?: AchievementId;
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

  if (!body.badgeId) {
    return NextResponse.json({ error: "badgeId is required" }, { status: 400 });
  }

  if (body.action === "grant_badge") {
    const score = await grantSellerPerformanceBadge({
      userId: body.userId,
      adminId: auth.user.id,
      badgeId: body.badgeId,
      reason: body.reason,
      ipAddress,
    });
    return NextResponse.json({ score });
  }

  if (body.action === "revoke_badge") {
    const score = await revokeSellerPerformanceBadge({
      userId: body.userId,
      adminId: auth.user.id,
      badgeId: body.badgeId,
      reason: body.reason,
      ipAddress,
    });
    return NextResponse.json({ score });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
