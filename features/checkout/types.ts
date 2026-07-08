export type CheckoutView = "checkout" | "success";

export type CheckoutStep = "delivery" | "payment" | "review";

export type CheckoutDraft = {
  deliveryOption: string;
  paymentMethod: import("@/lib/checkout/payment").PaymentMethodId;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
  acceptedReturnPolicy: boolean;
  addressId?: string;
};

export function createCheckoutDraft(
  address: Pick<CheckoutDraft, "recipientName" | "addressLine" | "postcode" | "country" | "addressId">,
  paymentMethod: CheckoutDraft["paymentMethod"],
): CheckoutDraft {
  return {
    deliveryOption: "",
    paymentMethod,
    acceptedReturnPolicy: false,
    ...address,
  };
}
