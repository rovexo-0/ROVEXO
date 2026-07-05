"use client";

import { usePageBack } from "@/hooks/navigation/usePageBack";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { transitionNormal } from "@/components/ui/tokens";
import { BackIcon, HeartIcon, ShareIcon } from "@/features/product-detail/icons";

type ProductDetailScrollHeaderProps = {
  visible: boolean;
  title: string;
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
};

export function ProductDetailScrollHeader({
  visible,
  title,
  isSaved,
  onSave,
  onShare,
}: ProductDetailScrollHeaderProps) {
  const back = usePageBack({ backHref: "/", backLabel: "Home" });

  return (
    <header
      className={cn(
        "rx-page-header fixed inset-x-0 top-0 z-[110]",
        transitionNormal,
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="flex items-center gap-ds-2 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        <IconButton label={back.label} variant="ghost" size="md" onClick={back.goBack}>
          <BackIcon className="h-5 w-5" />
        </IconButton>

        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{title}</h1>

        <IconButton
          label="Save item"
          variant="ghost"
          size="md"
          aria-pressed={isSaved}
          onClick={onSave}
          className={cn(isSaved && "text-danger")}
        >
          <HeartIcon filled={isSaved} className="h-5 w-5" />
        </IconButton>

        <IconButton label="Share item" variant="ghost" size="md" onClick={onShare}>
          <ShareIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </header>
  );
}
