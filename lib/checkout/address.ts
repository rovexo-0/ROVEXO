import type { UserProfile } from "@/lib/profile/types";

export type CheckoutAddress = {
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
};

export function getDefaultCheckoutAddress(profile: UserProfile): CheckoutAddress {
  return {
    recipientName: profile.fullName,
    addressLine: "12 Market Street, Dublin",
    postcode: "D02 X285",
    country: "Ireland",
  };
}
