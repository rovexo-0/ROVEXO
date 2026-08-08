/**
 * OPT-P0-PERF-05 — Stripe.js preconnect owner.
 *
 * Sole live client loadStripe consumer:
 * CardSetupSheet ← WalletPaymentMethodsPage ← /wallet/payment-methods
 *
 * Checkout uses server Stripe Checkout Sessions (checkout.stripe.com), not js.stripe.com.
 */
export default function WalletPaymentMethodsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
      {children}
    </>
  );
}
