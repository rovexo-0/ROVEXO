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
  addressId?: string;
};

export function createCheckoutDraft(
  address: Pick<CheckoutDraft, "recipientName" | "addressLine" | "postcode" | "country" | "addressId">,
  paymentMethod: PaymentMethodId,
): CheckoutDraft {
  return {
    deliveryOption: "standard",
    paymentMethod,
    acceptedReturnPolicy: false,
    ...address,
  };
}
