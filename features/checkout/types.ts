import type { PaymentMethodId } from "@/lib/checkout/payment";

export type CheckoutView = "checkout" | "success";

export type CheckoutDraft = {
  deliveryOption: "standard" | "express";
  paymentMethod: PaymentMethodId;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
  acceptedReturnPolicy: boolean;
};

export function createCheckoutDraft(
  address: Pick<CheckoutDraft, "recipientName" | "addressLine" | "postcode" | "country">,
  paymentMethod: PaymentMethodId,
): CheckoutDraft {
  return {
    deliveryOption: "standard",
    paymentMethod,
    acceptedReturnPolicy: false,
    ...address,
  };
}
