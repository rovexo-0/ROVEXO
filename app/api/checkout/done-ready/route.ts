import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { evaluateDoneReadinessGate } from "@/lib/checkout/done-readiness-gate-v1";

/**
 * Absolute Law FINAL LOCK — DONE readiness poll.
 * Client may poll silently; UI must never show Loading / Please try again / Conversation not found.
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const orderId = new URL(request.url).searchParams.get("order_id")?.trim() ?? "";
  if (!orderId) {
    return NextResponse.json({ allPass: false }, { status: 400 });
  }

  const gate = await evaluateDoneReadinessGate({
    orderId,
    buyerId: auth.user.id,
  });

  return NextResponse.json({
    allPass: gate.allPass,
    conversationId: gate.allPass ? gate.conversationId : null,
  });
}
