import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { ProfileCommandCentreEntry } from "@/lib/profile/command-centre-entry-v1";

type ProfileCommandCentreButtonProps = {
  entry: ProfileCommandCentreEntry;
};

function CommandCentreShieldIcon({ className }: { className?: string }) {
  return <PlatformEmoji emoji={PLATFORM_EMOJI.shield} size={20} className={className} />;
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
