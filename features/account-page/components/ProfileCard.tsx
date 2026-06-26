import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import { TrustScoreCard } from "@/features/account-page/components/TrustScoreCard";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { TrustDashboardData } from "@/lib/trust/types";
import type { UserProfile } from "@/lib/profile/types";

type ProfileCardProps = {
  profile: UserProfile;
  trustData?: TrustDashboardData;
};

export function ProfileCard({ profile, trustData }: ProfileCardProps) {
  return (
    <section className="account-profile-card" aria-labelledby="account-profile-name">
      <div className="account-profile-card__identity">
        <div className="account-profile-card__avatar-row">
          <Link
            href="/account/profile"
            className={cn("account-profile-card__avatar", focusRing)}
            aria-label="Edit profile"
          >
            <Avatar
              src={profile.avatarUrl}
              alt={profile.fullName}
              name={profile.fullName}
              size="lg"
            />
          </Link>
          <div className="account-profile-card__meta">
            <h2 id="account-profile-name" className="account-profile-card__name">
              {profile.fullName}
            </h2>
            <p className="account-profile-card__username">@{profile.username}</p>
            <p className="account-profile-card__since">Member since {profile.memberSince}</p>
          </div>
        </div>

        {profile.isSuperAdmin ? (
          <SuperAdminBadge />
        ) : profile.verified ? (
          <span className="account-profile-card__badge">
            <BadgeCheck size={14} strokeWidth={2} aria-hidden />
            Verified Seller
          </span>
        ) : null}
      </div>

      {trustData ? <TrustScoreCard trustData={trustData} /> : null}
    </section>
  );
}
