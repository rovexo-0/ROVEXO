import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { addressInputSchema } from "@/lib/account/schemas";
import { createUserAddress, listUserAddresses } from "@/lib/addresses/repository";
import { syncAutoVerifiedProfile } from "@/lib/profile/auto-verified";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const addressType = type === "billing" || type === "shipping" ? type : undefined;
  const addresses = await listUserAddresses(auth.user.id, addressType);
  return NextResponse.json({ addresses });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = addressInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid address." },
        { status: 400 },
      );
    }

    const address = await createUserAddress(auth.user.id, parsed.data);
    await syncAutoVerifiedProfile(auth.user.id);
    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save address." },
      { status: 400 },
    );
  }
}
