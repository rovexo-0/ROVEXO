"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { transitionNormal } from "@/components/ui/tokens";
import { BackIcon, HeartIcon } from "@/features/product-detail/icons";

type ProductDetailScrollHeaderProps = {
  visible: boolean;
  title: string;
  isSaved: boolean;
  onSave: () => void;
};

export function ProductDetailScrollHeader({
  visible,
  title,
  isSaved,
  onSave,
}: ProductDetailScrollHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "rx-page-header fixed inset-x-0 top-0 z-[110]",
        transitionNormal,
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0",
      )}
    >
      <div className="flex items-center gap-ds-2 px-ds-4 pb-ds-3 pt-[max(env(safe-area-inset-top),var(--ds-space-3))]">
        <IconButton label="Go back" variant="ghost" size="md" onClick={() => router.back()}>
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
      </div>
    </header>
  );
}
