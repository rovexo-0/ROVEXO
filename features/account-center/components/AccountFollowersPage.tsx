"use client";

import {
  CanonicalSection,
  CanonicalCard,
  CanonicalInfoBlock,
} from "@/src/components/canonical";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { formatCount } from "@/lib/account-center/derive";
import type { UserProfile } from "@/lib/profile/types";

type AccountFollowersPageProps = {
  profile: UserProfile;
  followerCount: number;
  backHref?: string;
};

/** Compact Followers summary — no fake Following tab / Selected chrome. */
export function AccountFollowersPage({
  profile,
  followerCount,
  backHref = "/account",
}: AccountFollowersPageProps) {
  const firstName = profile.fullName.split(" ")[0] ?? "you";

  return (
    <AccountCanonicalShell title="Followers" backHref={backHref} showHeaderTitle>
      <CanonicalSection title="Followers">
        <CanonicalCard variant="medium">
          <CanonicalInfoBlock variant="description">
            {formatCount(followerCount)} people follow {firstName}.
          </CanonicalInfoBlock>
        </CanonicalCard>
      </CanonicalSection>
    </AccountCanonicalShell>
  );
}
