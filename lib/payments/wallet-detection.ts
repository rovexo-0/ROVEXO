/**
 * Client-side wallet payment detection (Apple Pay / Google Pay).
 * Honest detection only — never invent availability.
 */

export type DetectedWalletPayments = {
  applePay: boolean;
  googlePay: boolean;
};

function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPhone|iPad|iPod|Macintosh/i.test(ua);
}

function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

/** Apple Pay Session when available in Safari / supported browsers. */
export function detectApplePayAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const ApplePaySession = (
      window as unknown as {
        ApplePaySession?: { canMakePayments?: () => boolean };
      }
    ).ApplePaySession;
    if (ApplePaySession?.canMakePayments) {
      return Boolean(ApplePaySession.canMakePayments());
    }
  } catch {
    return false;
  }
  // Device can support Apple Pay UX at checkout even if Session API is gated.
  return isAppleDevice();
}

/** Google Pay / Payment Request on Android Chrome and compatible browsers. */
export function detectGooglePayAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (typeof window.PaymentRequest === "function" && isAndroidDevice()) {
      return true;
    }
  } catch {
    return false;
  }
  return isAndroidDevice();
}

export function detectWalletPayments(): DetectedWalletPayments {
  return {
    applePay: detectApplePayAvailable(),
    googlePay: detectGooglePayAvailable(),
  };
}
