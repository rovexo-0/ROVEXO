import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/auth/session";
import {
  adminAdjustTrustScore,
  adminSetTrustScore,
  getTrustAnalyticsSummary,
  listPendingVerifications,
  listTrustAdminAudit,
  recalculateTrustScore,
  reviewTrustVerification,
} from "@/lib/trust/service";

const reviewSchema = z.object({
  action: z.literal("review"),
  verificationId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  level: z.enum(["basic", "verified", "premium", "enterprise"]).optional(),
});

const adminSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("adjust"),
    userId: z.string().uuid(),
    delta: z.number().int().min(-100).max(100),
    reason: z.string().min(3).max(500),
    lock: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("set"),
    userId: z.string().uuid(),
    score: z.number().int().min(0).max(100),
    reason: z.string().min(3).max(500),
    lock: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("recalculate"),
    userId: z.string().uuid(),
    reason: z.string().min(3).max(500).optional(),
  }),
  z.object({
    action: z.literal("lock"),
    userId: z.string().uuid(),
    reason: z.string().min(3).max(500),
  }),
]);

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const [summary, pending, audit] = await Promise.all([
    getTrustAnalyticsSummary(),
    listPendingVerifications(50),
    listTrustAdminAudit(undefined, 50),
  ]);

  return NextResponse.json({ summary, pending, audit });
}

export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    const review = reviewSchema.safeParse(body);
    if (review.success) {
      const success = await reviewTrustVerification({
        verificationId: review.data.verificationId,
        reviewerId: auth.user.id,
        status: review.data.status,
        level: review.data.level,
      });
      if (!success) {
        return NextResponse.json({ error: "Unable to review verification." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    const adminAction = adminSchema.safeParse(body);
    if (!adminAction.success) {
      return NextResponse.json({ error: "Invalid trust admin request." }, { status: 400 });
    }

    const payload = adminAction.data;
    if (payload.action === "adjust") {
      const score = await adminAdjustTrustScore({
        adminId: auth.user.id,
        userId: payload.userId,
        delta: payload.delta,
        reason: payload.reason,
        lock: payload.lock,
      });
      return NextResponse.json({ score });
    }

    if (payload.action === "set") {
      const score = await adminSetTrustScore({
        adminId: auth.user.id,
        userId: payload.userId,
        score: payload.score,
        reason: payload.reason,
        lock: payload.lock,
      });
      return NextResponse.json({ score });
    }

    if (payload.action === "recalculate") {
      const score = await recalculateTrustScore(payload.userId, payload.reason ?? "admin_recalculate");
      return NextResponse.json({ score });
    }

    await adminSetTrustScore({
      adminId: auth.user.id,
      userId: payload.userId,
      score: (await recalculateTrustScore(payload.userId)).score,
      reason: payload.reason,
      lock: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid trust admin request." }, { status: 400 });
  }
}
