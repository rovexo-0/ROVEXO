import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { lookupUkAddressesByPostcode } from "@/lib/addresses/uk-lookup";
import { toUserSafeFailClosedMessage } from "@/lib/fail-closed";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const postcode = searchParams.get("postcode")?.trim() ?? "";

  try {
    const addresses = await lookupUkAddressesByPostcode(postcode);
    return NextResponse.json({ addresses });
  } catch (error) {
    const known =
      error instanceof Error &&
      (error.message === "Enter a valid UK postcode." ||
        error.message === "Address lookup temporarily unavailable.");
    const message = known
      ? error.message
      : toUserSafeFailClosedMessage(error).body;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
