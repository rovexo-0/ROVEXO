import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { addressInputSchema } from "@/lib/account/schemas";
import { resolveCheckoutShippingAddress } from "@/lib/addresses/repository";

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = addressInputSchema.safeParse({
      ...body,
      addressType: "shipping",
      isDefault: true,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid address." },
        { status: 400 },
      );
    }

    const address = await resolveCheckoutShippingAddress(auth.user.id, parsed.data);
    return NextResponse.json({ addressId: address.id, address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to confirm delivery address." },
      { status: 400 },
    );
  }
}
