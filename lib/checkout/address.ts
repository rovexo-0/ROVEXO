import type { UserProfile } from "@/lib/profile/types";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { getDefaultAddress } from "@/lib/addresses/repository";

export type CheckoutAddress = {
  addressId?: string;
  recipientName: string;
  addressLine: string;
  addressLine2?: string | null;
  city?: string | null;
  postcode: string;
  country: string;
};

export async function getDefaultCheckoutAddress(profile: UserProfile): Promise<CheckoutAddress> {
  const saved = await getDefaultAddress(profile.id, "shipping");

  if (saved) {
    return {
      addressId: saved.id,
      recipientName: saved.recipientName,
      addressLine: saved.addressLine,
      addressLine2: saved.addressLine2,
      city: saved.city,
      postcode: saved.postcode,
      country: saved.country,
    };
  }

  return {
    recipientName: profile.fullName,
    addressLine: "",
    postcode: "",
    country: UK_DEFAULT_COUNTRY,
  };
}
