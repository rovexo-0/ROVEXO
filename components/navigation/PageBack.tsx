"use client";

import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import { usePageBack, type UsePageBackOptions } from "@/hooks/navigation/usePageBack";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

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
        <span aria-hidden>←</span>
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
      <BackIcon className="h-5 w-5" />
    </IconButton>
  );
}
