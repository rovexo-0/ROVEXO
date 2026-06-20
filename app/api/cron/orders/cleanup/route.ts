import { NextResponse } from "next/server";
import { runProductionMaintenance } from "@/lib/cron/maintenance";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  return Boolean(secret && authHeader === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runProductionMaintenance();
  return NextResponse.json({
    success: true,
    cleaned: result.expiredOrders,
    emailsSent: result.emailsSent,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
