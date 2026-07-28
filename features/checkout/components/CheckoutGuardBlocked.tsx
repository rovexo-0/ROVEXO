"use client";

import Link from "next/link";
import {
  toBuyNowPublicMessage,
  type RvxClassifiedCode,
} from "@/lib/checkout/buy-now-guard-v1";

type CheckoutGuardBlockedProps = {
  code: RvxClassifiedCode;
  listingHref?: string;
};

/**
 * Absolute UX Law — checkout blocked.
 * User sees only Sorry + OK path. Never RVX / engine / blocked jargon.
 */
export function CheckoutGuardBlocked({ code, listingHref = "/" }: CheckoutGuardBlockedProps) {
  const publicMessage = toBuyNowPublicMessage(code);
  const lines = publicMessage.split("\n").filter(Boolean);

  return (
    <section
      className="mx-auto flex w-full max-w-none flex-col items-center px-6 py-10 text-center"
      data-blood-code-xxiv="1.0"
      data-checkout-guard="BLOCKED"
      data-buy-now-public-error="1"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-lg font-semibold text-text-primary">{lines[0]}</p>
      {lines.slice(1).map((line) => (
        <p key={line} className="mt-2 text-sm text-text-secondary">
          {line}
        </p>
      ))}
      <Link
        href={listingHref}
        className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-white"
      >
        OK
      </Link>
    </section>
  );
}
