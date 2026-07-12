"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";

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
    <AccountCanonicalShell title="Followers" backHref="/account">
      <CanonicalSection title="Views">
        <CanonicalCard variant="list">
          {TABS.map((tab) => (
            <CanonicalMenuRow
              key={tab.id}
              title={tab.label}
              href={tab.href}
              value={tab.active ? "Selected" : "soon" in tab && tab.soon ? "Soon" : undefined}
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>

      <CanonicalInfoBlock variant="description">
        {formatCount(followerCount)} people follow {profile.fullName.split(" ")[0] ?? "you"}.
      </CanonicalInfoBlock>

      <CanonicalInfoBlock variant="description">Follower list will appear here.</CanonicalInfoBlock>
    </AccountCanonicalShell>
  );
}
