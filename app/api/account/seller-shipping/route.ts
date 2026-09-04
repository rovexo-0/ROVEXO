import { sellerShippingSettingsSchema } from "@/lib/account/schemas";
import {
  loadSellerShippingSettings,
  updateSellerShippingSettings,
} from "@/lib/seller/shipping-settings";
import { requireApiAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { settings, configured } = await loadSellerShippingSettings(auth.user.id);
  return NextResponse.json({ settings, configured });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = sellerShippingSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid shipping settings." },
        { status: 400 },
      );
    }

    const settings = await updateSellerShippingSettings(auth.user.id, parsed.data);
    return NextResponse.json({ settings, configured: true });
  } catch {
    return NextResponse.json({ error: "Unable to update shipping settings." }, { status: 500 });
  }
}
