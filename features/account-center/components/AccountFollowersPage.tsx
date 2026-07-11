"use client";

import Link from "next/link";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { formatCount } from "@/lib/account-center/derive";
import type { UserProfile } from "@/lib/profile/types";

type AccountFollowersPageProps = {
  profile: UserProfile;
  followerCount: number;
};

const TABS = [
  { id: "followers", label: "Followers", href: "/account/followers", active: true },
  { id: "following", label: "Following", href: "/account/followers?tab=following", active: false },
  { id: "requests", label: "Follow requests", href: "/account/followers?tab=requests", active: false, soon: true },
] as const;

export function AccountFollowersPage({ profile, followerCount }: AccountFollowersPageProps) {
  return (
    <AccountModuleShell title="Followers" backHref="/account" version="v2.0-module-02">
      <div className="ac-followers" data-ac-followers-version="v2.0">
        <nav className="ac-followers__tabs" aria-label="Follow views">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className="ac-followers__tab"
              data-soon={"soon" in tab && tab.soon ? "true" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <p className="ac-followers__summary">
          {formatCount(followerCount)} people follow {profile.fullName.split(" ")[0] ?? "you"}.
        </p>

        <p className="ac-followers__empty">Follower list will appear here.</p>
      </div>
    </AccountModuleShell>
  );
}
