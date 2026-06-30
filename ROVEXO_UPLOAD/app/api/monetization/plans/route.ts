import { NextResponse } from "next/server";
import { listMonetizationPlans } from "@/lib/monetization/service";

export async function GET() {
  const plans = await listMonetizationPlans();
  return NextResponse.json({ plans });
}
