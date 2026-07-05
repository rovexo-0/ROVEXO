"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type ForbiddenBackButtonProps = {
  fallbackHref?: string;
  className?: string;
};

export function ForbiddenBackButton({
  fallbackHref = "/",
  className,
}: ForbiddenBackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={cn(
        "inline-flex min-h-ds-7 items-center justify-center rounded-ds-md border border-border bg-surface px-ds-4 text-sm font-semibold text-text-primary",
        focusRing,
        className,
      )}
    >
      Back
    </button>
  );
}
