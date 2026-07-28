"use client";

import { useRouter } from "next/navigation";
import { STORE_UNAVAILABLE_COPY } from "@/lib/homepage/homepage-final-freeze-v1";

type UnavailableKind = "store" | "listing";

type StoreUnavailablePageProps = {
  kind?: UnavailableKind;
};

/**
 * Homepage CEO Final Lock — 404 protection.
 * Seller/store/listing missing → Store unavailable + BACK. Never 404.
 */
export function StoreUnavailablePage({ kind = "store" }: StoreUnavailablePageProps) {
  const router = useRouter();
  const copy = STORE_UNAVAILABLE_COPY;

  return (
    <main
      className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 px-6 text-center"
      data-store-unavailable="v1.0"
      data-unavailable-kind={kind}
      role="status"
      aria-live="polite"
    >
      <h1 className="text-[20px] font-semibold text-text-primary">{copy.title}</h1>
      <p className="max-w-sm text-[14px] text-text-secondary">{copy.body}</p>
      <button
        type="button"
        className="min-h-11 rounded-2xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
          }
          router.push("/");
        }}
      >
        {copy.backLabel}
      </button>
    </main>
  );
}
