import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { createCheckoutDraft } from "@/features/checkout/types";
import { getDefaultCheckoutAddress } from "@/lib/checkout/address";
import { getDefaultPaymentMethod } from "@/lib/checkout/payment";
import { fetchProductBySlug } from "@/lib/products/queries";
import { getProfileDetails } from "@/lib/profile/service";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { resolveProfileCompletionRedirect } from "@/lib/account/profile-completion";
import { getProfile } from "@/lib/profile/data";
import { validateProductPurchasable } from "@/lib/transaction-hub/checkout-validation";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  const conversationId = searchParams.get("conversationId")?.trim() ?? undefined;

  if (!slug) {
    return NextResponse.json({ success: false, error: "Product slug is required." }, { status: 400 });
  }

  const product = await fetchProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
  }

  const validation = validateProductPurchasable(product);
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
  }

  const completionRedirect = await resolveProfileCompletionRedirect(
    auth.user.id,
    "checkout",
    `/messages${conversationId ? `/${conversationId}` : ""}`,
  );

  if (completionRedirect) {
    return NextResponse.json({
      success: false,
      error: "Complete your profile before checkout.",
      completionRedirect,
    }, { status: 403 });
  }

  const profile = await getProfile();
  const address = await getDefaultCheckoutAddress(profile);
  const initialDraft = createCheckoutDraft(address, getDefaultPaymentMethod());
  const details = await getProfileDetails(profile.id);

  return NextResponse.json({
    success: true,
    product,
    initialDraft,
    buyerPhone: details?.phone ?? null,
    liveShippingEnabled: isSendcloudConfigured(),
    conversationId,
  });
}
