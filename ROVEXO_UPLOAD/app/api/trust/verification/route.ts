import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { requestTrustVerification } from "@/lib/trust/service";

const schema = z.object({
  verificationType: z.enum([
    "email",
    "phone",
    "identity",
    "address",
    "payment",
    "business",
    "wholesale",
    "manufacturer",
    "supplier",
    "document",
  ]),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = schema.parse(await request.json());
    const verification = await requestTrustVerification(auth.user.id, body.verificationType);
    if (!verification) return NextResponse.json({ error: "Unable to submit verification." }, { status: 500 });
    return NextResponse.json({ success: true, verification });
  } catch {
    return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
  }
}
