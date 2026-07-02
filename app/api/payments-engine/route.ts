import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getPaymentsEngineAnalyticsForUser,
  getPaymentsEngineContext,
  getPaymentsEnginePaymentContext,
  getPublicPaymentsEngineConfig,
  listPaymentsEngineSummaries,
} from "@/lib/payments-engine/reader";
import type { PaymentsEngineFilterId } from "@/lib/payments-engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const filter = url.searchParams.get("filter") as PaymentsEngineFilterId | null;
  const query = url.searchParams.get("q") ?? undefined;

  if (orderId) {
    const context = await getPaymentsEnginePaymentContext(orderId);
    if (!context) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, context, summaries, analytics] = await Promise.all([
    getPublicPaymentsEngineConfig(),
    getPaymentsEngineContext(auth.user.id),
    listPaymentsEngineSummaries(auth.user.id, { filter: filter ?? undefined, query }),
    getPaymentsEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, summaries, analytics });
}
