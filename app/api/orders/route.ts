import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { listOrders } from "@/lib/orders/store";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const orders = await listOrders();
  return NextResponse.json({ orders });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Use POST /api/orders/checkout to start a Stripe checkout session.",
    },
    { status: 410 },
  );
}
