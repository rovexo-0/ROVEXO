"use client";

import { useRouter } from "next/navigation";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { focusRing } from "@/components/ui/tokens";
import {
  ROVEXO_HEADER_STANDARD_CLOSE,
  ROVEXO_HEADER_STANDARD_DOM,
} from "@/lib/header/rovexo-header-standard-v1";

export type RovexoHeaderCloseButtonProps = {
  className?: string;
  /** Used when history stack is empty. */
  fallbackHref?: string;
  onClose?: () => void;
};

function CloseIcon() {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.close} size={22} />;
}

/**
 * ROVEXO Header Standard v1.0 — Close (X).
 * Same control as Orders / Visit Store: history.back() else fallback.
 */
export function RovexoHeaderCloseButton({
  className,
  fallbackHref = ROVEXO_HEADER_STANDARD_CLOSE.defaultFallbackHref,
  onClose,
}: RovexoHeaderCloseButtonProps) {
  const router = useRouter();

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      className={cn("rx-header-close", focusRing, className)}
      aria-label={ROVEXO_HEADER_STANDARD_CLOSE.ariaLabel}
      data-rovexo-header-close={ROVEXO_HEADER_STANDARD_DOM}
      onClick={handleClose}
    >
      <CloseIcon />
    </button>
  );
}
