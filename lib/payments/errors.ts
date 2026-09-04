import Stripe from "stripe";

export class PaymentSetupError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = "payment_setup_failed", options?: { cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "PaymentSetupError";
    this.status = status;
    this.code = code;
  }
}

export function logPaymentSetupError(context: string, error: unknown): void {
  if (error instanceof PaymentSetupError) {
    console.error(`[payment-setup] ${context}:`, {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    return;
  }

  if (error instanceof Stripe.errors.StripeError) {
    console.error(`[payment-setup] ${context}:`, {
      type: error.type,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });
    return;
  }

  console.error(`[payment-setup] ${context}:`, error);
}

export function paymentSetupErrorMessage(error: unknown): {
  message: string;
  status: number;
  code: string;
  actionable?: "retry" | "manage_on_stripe";
} {
  if (error instanceof PaymentSetupError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      actionable:
        error.code === "stripe_portal_unavailable" || error.code === "stripe_not_configured"
          ? "retry"
          : error.code.startsWith("stripe_")
            ? "manage_on_stripe"
            : "retry",
    };
  }

  if (error instanceof Stripe.errors.StripeError) {
    const code = error.code ?? "stripe_error";
    const resourceMissing =
      code === "resource_missing" ||
      /no such customer/i.test(error.message ?? "") ||
      /no such payment_method/i.test(error.message ?? "");
    const message = resourceMissing
      ? "Your saved Stripe payment profile is out of date. Please try adding the card again."
      : "Card setup could not be completed with Stripe. Please try again.";
    return {
      message,
      status: error.statusCode ?? 502,
      code,
      actionable: "retry",
    };
  }

  if (error instanceof Error) {
    return { message: "Card setup failed. Please try again.", status: 500, code: "payment_setup_failed", actionable: "retry" };
  }

  return {
    message: "Card setup failed for an unknown reason.",
    status: 500,
    code: "payment_setup_failed",
    actionable: "retry",
  };
}
