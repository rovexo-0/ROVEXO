"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuthBackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

function BackChevron() {
  return (
    <svg className="auth-back-button__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuthBackButton({ href, label = "Back", className }: AuthBackButtonProps) {
  return (
    <Link href={href} className={cn("auth-back-button", focusRing, className)} aria-label={label}>
      <BackChevron />
      <span className="auth-back-button__label">{label}</span>
    </Link>
  );
}
