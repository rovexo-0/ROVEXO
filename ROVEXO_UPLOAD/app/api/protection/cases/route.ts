import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  createProtectionCase,
  getProtectionCaseByOrderId,
  listProtectionCasesForUser,
} from "@/lib/protection/service";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (orderId) {
    const caseRecord = await getProtectionCaseByOrderId(orderId);
    if (!caseRecord) {
      return NextResponse.json({ case: null });
    }

    if (caseRecord.buyerId !== auth.user.id && caseRecord.sellerId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    return NextResponse.json({ case: caseRecord });
  }

  const role = searchParams.get("role") === "seller" ? "seller" : "buyer";
  const cases = await listProtectionCasesForUser(auth.user.id, role);
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    orderId?: string;
    caseType?: "refund" | "return" | "dispute";
    reason?: string;
    description?: string;
  };

  if (!body.orderId || !body.caseType || !body.reason) {
    return NextResponse.json({ error: "orderId, caseType, and reason are required." }, { status: 400 });
  }

  const caseRecord = await createProtectionCase({
    orderId: body.orderId,
    buyerId: auth.user.id,
    caseType: body.caseType,
    reason: body.reason,
    description: body.description,
  });

  if (!caseRecord) {
    return NextResponse.json({ error: "Failed to open protection case." }, { status: 500 });
  }

  return NextResponse.json({ case: caseRecord }, { status: 201 });
}
