"use client";

import { usePageBack } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { GlassIconButton } from "@/features/product-detail/GlassIconButton";
import { BackIcon, HeartIcon, ShareIcon } from "@/features/product-detail/icons";

type ProductDetailTopBarProps = {
  isSaved: boolean;
  heartAnimating: boolean;
  onSave: () => void;
  onShare: () => void;
};

export function ProductDetailTopBar({
  isSaved,
  heartAnimating,
  onSave,
  onShare,
}: ProductDetailTopBarProps) {
  const back = usePageBack({ backHref: "/", backLabel: "Home" });

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10">
      <div className="flex items-center justify-between px-ds-4 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        <GlassIconButton
          label={back.label}
          onClick={back.goBack}
          className="pointer-events-auto"
        >
          <BackIcon className="h-5 w-5" />
        </GlassIconButton>

        <div className="pointer-events-auto flex items-center gap-ds-2">
          <GlassIconButton
            label="Save item"
            aria-pressed={isSaved}
            onClick={onSave}
            className={cn(
              isSaved && "text-danger",
              heartAnimating && "scale-125",
              heartAnimating && isSaved && "animate-pulse",
            )}
          >
            <HeartIcon filled={isSaved} className="h-5 w-5" />
          </GlassIconButton>

          <GlassIconButton label="Share item" onClick={onShare}>
            <ShareIcon className="h-5 w-5" />
          </GlassIconButton>
        </div>
      </div>
    </div>
  );
}
