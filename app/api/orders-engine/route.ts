import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getOrdersEngineAnalyticsForUser,
  getOrdersEngineOrderContext,
  getPublicOrdersEngineConfig,
  listOrdersEngineSummaries,
} from "@/lib/orders-engine/reader";
import type { OrdersEngineFilterId } from "@/lib/orders-engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const filter = url.searchParams.get("filter") as OrdersEngineFilterId | null;
  const query = url.searchParams.get("q") ?? undefined;

  if (orderId) {
    const context = await getOrdersEngineOrderContext(orderId);
    if (!context) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, summaries, analytics] = await Promise.all([
    getPublicOrdersEngineConfig(),
    listOrdersEngineSummaries(auth.user.id, { filter: filter ?? undefined, query }),
    getOrdersEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, summaries, analytics });
}
