import { buyerPreferencesSchema } from "@/lib/account/schemas";
import { getBuyerPreferences, updateBuyerPreferences } from "@/lib/buyer/preferences";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const preferences = await getBuyerPreferences(auth.user.id);
  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = buyerPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid buyer preferences." },
        { status: 400 },
      );
    }

    const preferences = await updateBuyerPreferences(auth.user.id, parsed.data);
    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json({ error: "Unable to update buyer preferences." }, { status: 500 });
  }
}
