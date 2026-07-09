import Stripe from "stripe";

export class PaymentSetupError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = "payment_setup_failed") {
    super(message);
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

export function paymentSetupErrorMessage(error: unknown): { message: string; status: number; code: string } {
  if (error instanceof PaymentSetupError) {
    return { message: error.message, status: error.status, code: error.code };
  }

  if (error instanceof Stripe.errors.StripeError) {
    const message =
      error.message ||
      `Stripe error (${error.code ?? error.type ?? "unknown"}). Check STRIPE_SECRET_KEY and dashboard settings.`;
    return { message, status: error.statusCode ?? 502, code: error.code ?? "stripe_error" };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500, code: "payment_setup_failed" };
  }

  return { message: "Card setup failed for an unknown reason.", status: 500, code: "payment_setup_failed" };
}
