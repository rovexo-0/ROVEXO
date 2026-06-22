import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/session";
import { reviewTrustVerification } from "@/lib/trust/service";

const schema = z.object({
  verificationId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  level: z.enum(["basic", "verified", "premium", "enterprise"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["admin"]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = schema.parse(await request.json());
    const success = await reviewTrustVerification({
      verificationId: body.verificationId,
      reviewerId: auth.user.id,
      status: body.status,
      level: body.level,
    });
    if (!success) return NextResponse.json({ error: "Unable to review verification." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }
}
