"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { focusRing } from "@/components/ui/tokens";

type AuthBackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

function BackChevron() {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.back} className="auth-back-button__icon" />;
}

export function AuthBackButton({ href, label = "Back", className }: AuthBackButtonProps) {
  return (
    <Link href={href} className={cn("auth-back-button", focusRing, className)} aria-label={label}>
      <BackChevron />
      <span className="auth-back-button__label">{label}</span>
    </Link>
  );
}
