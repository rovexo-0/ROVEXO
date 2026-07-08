"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { UserProfile } from "@/lib/profile/types";

type AccountHubProfileProps = {
  profile: UserProfile;
};

export function AccountHubProfile({ profile }: AccountHubProfileProps) {
  return (
    <Link
      href="/account/profile"
      className={cn("ac-hub__profile-card", focusRing)}
      aria-label={`${profile.fullName}, view profile`}
    >
      <div className="ac-hub__profile-avatar">
        <Avatar
          src={profile.avatarUrl}
          alt={profile.fullName}
          name={profile.fullName}
          size="lg"
          className="h-full w-full"
        />
      </div>

      <div className="ac-hub__profile-copy">
        <div className="ac-hub__profile-name-row">
          <h1 className="ac-hub__profile-name">{profile.fullName}</h1>
          {profile.verified ? (
            <span className="ac-hub__verified">
              <span aria-hidden>✓</span> Verified
            </span>
          ) : null}
        </div>
        <p className="ac-hub__profile-email">{profile.email}</p>
      </div>
    </Link>
  );
}
