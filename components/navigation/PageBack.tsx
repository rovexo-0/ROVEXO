"use client";

import Link from "next/link";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { IconButton } from "@/components/ui/IconButton";
import { usePageBack, type UsePageBackOptions } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { focusRing } from "@/components/ui/tokens";

type PageBackProps = UsePageBackOptions & {
  variant?: "icon" | "text";
  className?: string;
};

export function PageBack({ variant = "icon", className, ...options }: PageBackProps) {
  const back = usePageBack(options);

  if (!back.visible) {
    return null;
  }

  if (variant === "text") {
    return (
      <Link
        href={back.href}
        onClick={(event) => {
          event.preventDefault();
          back.goBack();
        }}
        className={cn("inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary", focusRing, className)}
      >
        <span aria-hidden>{PLATFORM_EMOJI.back}</span>
        {back.label}
      </Link>
    );
  }

  return (
    <IconButton
      label={back.label}
      variant="ghost"
      size="md"
      className={className}
      onClick={back.goBack}
    >
      <PlatformEmoji emoji={PLATFORM_EMOJI.back} size={20} className="h-5 w-5" />
    </IconButton>
  );
}
