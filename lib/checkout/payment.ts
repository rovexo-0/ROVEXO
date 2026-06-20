export type PaymentMethodId =
  | "saved_card"
  | "apple_pay"
  | "google_pay"
  | "card"
  | "paypal";

export type PaymentMethodOption = {
  id: PaymentMethodId;
  label: string;
  detail?: string;
};

export const PAYPAL_ENABLED = true;

export const SAVED_CARD_DETAIL = "Visa ending 4242";

export function getAvailablePaymentMethods(options?: {
  isIOS?: boolean;
  isAndroid?: boolean;
}): PaymentMethodOption[] {
  const methods: PaymentMethodOption[] = [
    { id: "saved_card", label: "Saved Card", detail: SAVED_CARD_DETAIL },
  ];

  if (options?.isIOS) {
    methods.push({ id: "apple_pay", label: "Apple Pay" });
  }

  if (options?.isAndroid) {
    methods.push({ id: "google_pay", label: "Google Pay" });
  }

  methods.push({ id: "card", label: "Credit / Debit Card" });

  if (PAYPAL_ENABLED) {
    methods.push({ id: "paypal", label: "PayPal" });
  }

  return methods;
}

export function getDefaultPaymentMethod(options?: {
  isIOS?: boolean;
  isAndroid?: boolean;
}): PaymentMethodId {
  const methods = getAvailablePaymentMethods(options);
  return methods[0]?.id ?? "card";
}

export function getPaymentMethodLabel(
  methodId: PaymentMethodId,
  options?: { isIOS?: boolean; isAndroid?: boolean },
): string {
  const method = getAvailablePaymentMethods(options).find((item) => item.id === methodId);
  if (!method) return "Credit / Debit Card";
  return method.detail ? `${method.label} · ${method.detail}` : method.label;
}
