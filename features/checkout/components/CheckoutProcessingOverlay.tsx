"use client";

import { cn } from "@/lib/cn";
import { ModalContainer } from "@/components/ui/ModalContainer";

export function CheckoutProcessingOverlay() {
  return (
    <ModalContainer
      open
      onClose={() => undefined}
      variant="centered"
      zIndex={120}
      scrollPanel={false}
      ariaLabel="Processing payment"
    >
      <div
        className="flex flex-col items-center gap-ds-3 rounded-ds-lg bg-surface px-ds-6 py-ds-5 shadow-ds-floating"
        role="status"
        aria-live="polite"
      >
        <svg className={cn("h-8 w-8 animate-spin text-primary")} viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
        <p className="text-sm font-medium text-text-primary">Processing payment...</p>
      </div>
    </ModalContainer>
  );
}
