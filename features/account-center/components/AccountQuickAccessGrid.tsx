"use client";

import Link from "next/link";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { getQuickAccessIcon } from "@/lib/account-center/tile-icons";
import { AvatarUploader } from "@/features/account/components/AvatarUploader";
import { NotificationBadge } from "@/features/account-center/components/NotificationBadge";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { AccountQuickAccessModule } from "@/lib/account-center/modules";

type AccountQuickAccessGridProps = {
  modules: AccountQuickAccessModule[];
  resolveBadge: (module: AccountQuickAccessModule) => number;
  sectionTitle?: string;
};

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 5 5 5-5 5" />
    </svg>
  );
}

export function AccountQuickAccessGrid({ modules, resolveBadge, sectionTitle = "Quick Access" }: AccountQuickAccessGridProps) {
  return (
    <section className="account-center-quick-section" aria-labelledby="account-quick-access-title">
      <h2 id="account-quick-access-title" className="account-center-quick-section__title">
        {sectionTitle}
      </h2>
      <div className="account-center-quick">
        {modules.map((module) => {
          const badgeCount = resolveBadge(module);
          const icon = getQuickAccessIcon(module.id);
          return (
            <Link
              key={module.id}
              href={module.href}
              className={cn("account-center-quick__card", focusRing)}
              aria-label={`${module.title}. ${module.subtitle}`}
            >
              {badgeCount > 0 ? (
                <NotificationBadge count={badgeCount} className="account-center-quick__badge" />
              ) : null}
              <div
                className="account-center-quick__icon"
                style={{ backgroundColor: icon.background }}
                aria-hidden
              >
                <span className="account-center-quick__emoji">{icon.emoji}</span>
              </div>
              <div className="account-center-quick__body">
                <p className="account-center-quick__title">{module.title}</p>
                <p className="account-center-quick__subtitle">{module.subtitle}</p>
              </div>
              <ChevronIcon className="account-center-quick__chevron h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function AccountAvatarSheet({
  open,
  onClose,
  name,
  avatarUrl,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: string | null;
  onUpdated: (url: string | null) => void;
}) {
  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      variant="sheet"
      zIndex={100}
      ariaLabel="Change profile photo"
      panelClassName="account-center-avatar-sheet__panel"
    >
      <AvatarUploader
        name={name}
        avatarUrl={avatarUrl}
        onUpdated={(url) => {
          onUpdated(url);
          onClose();
        }}
      />
    </ModalContainer>
  );
}
