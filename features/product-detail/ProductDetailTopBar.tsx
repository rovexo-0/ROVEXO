"use client";

import { usePageBack } from "@/hooks/navigation/usePageBack";
import { GlassIconButton } from "@/features/product-detail/GlassIconButton";
import { BackIcon } from "@/features/product-detail/icons";

/**
 * Minimal overlay for the main product image. Per the Clean Image Policy the
 * image must stay unobstructed, so only the Back control appears here. Save and
 * Share live in the scroll header (off-image) to preserve that functionality.
 */
export function ProductDetailTopBar() {
  const back = usePageBack({ backHref: "/", backLabel: "Home" });

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="flex items-center px-ds-4 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        <GlassIconButton
          label={back.label}
          onClick={back.goBack}
          className="pointer-events-auto"
        >
          <BackIcon className="h-5 w-5" />
        </GlassIconButton>
      </div>
    </div>
  );
}
