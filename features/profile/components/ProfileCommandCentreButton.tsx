"use client";

import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { ProfileCommandCentreEntry } from "@/lib/profile/command-centre-entry-v1";

type ProfileCommandCentreButtonProps = {
  entry: ProfileCommandCentreEntry;
};

function CommandCentreShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.5 19 6v5c0 5-3 8-7 9.5C8 19 5 16 5 11V6l7-2.5Z" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  );
}

/**
 * Full-width premium red Command Centre CTA — My Profile only.
 * No subtitle. Conditional render upstream (never hidden via CSS).
 */
export function ProfileCommandCentreButton({ entry }: ProfileCommandCentreButtonProps) {
  return (
    <div className="vp-v1__command-centre" data-command-centre={entry.kind}>
      <Link
        href={entry.href}
        className={cn("vp-v1__command-centre-btn", focusRing)}
        aria-label={entry.ariaLabel}
        data-testid={`command-centre-${entry.kind}`}
        prefetch
      >
        <span className="vp-v1__command-centre-leading">
          <CommandCentreShieldIcon className="vp-v1__command-centre-icon" />
          <span className="vp-v1__command-centre-label">{entry.label}</span>
        </span>
        <span className="vp-v1__command-centre-trailing">
          <span className="vp-v1__command-centre-badge">{entry.badge}</span>
          <ChevronRightLineIcon className="vp-v1__command-centre-chevron" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
