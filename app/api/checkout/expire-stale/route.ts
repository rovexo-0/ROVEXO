/**
 * Checkout Session Self-Heal entry — TTL Absolute Law 120s.
 * Canonical: expire stale sessions before commerce surfaces continue.
 * Does not depend on daily cron.
 */

import { NextResponse } from "next/server";
import { CHECKOUT_SESSION_ENGINE_selfHeal } from "@/lib/checkout/engines/checkout-session-engine-v1";

export async function POST() {
  try {
    const result = await CHECKOUT_SESSION_ENGINE_selfHeal();
    return NextResponse.json({
      success: result.ok,
      expired: result.expired,
      restored: result.restored,
      failures: result.failures,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "self-heal failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
