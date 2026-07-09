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

export function getAvailablePaymentMethods(options?: {
  isIOS?: boolean;
  isAndroid?: boolean;
  savedCardDetail?: string | null;
}): PaymentMethodOption[] {
  const methods: PaymentMethodOption[] = [];

  if (options?.savedCardDetail) {
    methods.push({ id: "saved_card", label: "Saved Card", detail: options.savedCardDetail });
  }

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
  savedCardDetail?: string | null;
}): PaymentMethodId {
  const methods = getAvailablePaymentMethods(options);
  return methods[0]?.id ?? "card";
}

export function getPaymentMethodLabel(
  methodId: PaymentMethodId,
  options?: { isIOS?: boolean; isAndroid?: boolean; savedCardDetail?: string | null },
): string {
  const methods = getAvailablePaymentMethods(options);
  const method = methods.find((item) => item.id === methodId);
  if (!method) return "Credit / Debit Card";
  return method.detail ? `${method.label} · ${method.detail}` : method.label;
}
