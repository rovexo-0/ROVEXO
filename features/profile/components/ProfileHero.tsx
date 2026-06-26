import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MotionDiv } from "@/components/ui/motion";
import { Rating } from "@/components/ui/Rating";
import { VerifiedIcon } from "@/features/product-detail/icons";
import { SuperAdminBadge } from "@/features/auth/components/SuperAdminBadge";
import type { UserProfile } from "@/lib/profile/types";

type ProfileHeroProps = {
  profile: UserProfile;
  variant?: "default" | "dashboard";
};

export function ProfileHero({ profile, variant = "default" }: ProfileHeroProps) {
  const isDashboard = variant === "dashboard";

  return (
    <MotionDiv
      className={isDashboard ? "account-dash-card overflow-hidden p-ds-4" : "premium-card overflow-hidden p-ds-6"}
    >
      <section aria-labelledby="profile-name" className="relative z-[1] flex flex-col items-center gap-ds-4 text-center">
        <div className="relative">
          <Avatar
            src={profile.avatarUrl}
            alt={profile.fullName}
            name={profile.fullName}
            size="xl"
            className="ring-4 ring-primary/10"
          />
        </div>

        {profile.isSuperAdmin ? (
          <SuperAdminBadge />
        ) : profile.verified ? (
          <Badge variant="success" className="gap-ds-1">
            <VerifiedIcon className="h-3.5 w-3.5" />
            Verified seller
          </Badge>
        ) : null}

        <div className="flex w-full flex-col gap-ds-1">
          <h2 id="profile-name" className="truncate text-xl font-semibold text-text-primary">
            {profile.fullName}
          </h2>
          <p className="truncate text-sm text-text-secondary">@{profile.username}</p>
          <p className="text-xs text-text-muted">Member since {profile.memberSince}</p>
        </div>

        <div className="premium-glass premium-depth-1 grid w-full grid-cols-2 gap-ds-3 rounded-ds-lg p-ds-3">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Buyer rating</p>
            <div className="mt-ds-1 flex justify-center">
              <Rating value={4.8} size="sm" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Seller rating</p>
            <p className="mt-ds-1 text-sm font-semibold text-text-primary">
              {profile.isSeller ? "4.9 ★" : "Not a seller"}
            </p>
          </div>
        </div>

        <Link href="/account/profile" className="w-full">
          <Button variant="primary" size="md" fullWidth className="min-h-ds-7 rounded-ds-lg">
            Edit profile
          </Button>
        </Link>
      </section>
    </MotionDiv>
  );
}
