import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VerifiedIcon } from "@/features/product-detail/icons";
import type { UserProfile } from "@/lib/profile/types";

type ProfileHeroProps = {
  profile: UserProfile;
};

export function ProfileHero({ profile }: ProfileHeroProps) {
  return (
    <section aria-labelledby="profile-name" className="flex flex-col items-center gap-ds-3 text-center">
      <Avatar
        src={profile.avatarUrl}
        alt={profile.fullName}
        name={profile.fullName}
        size="xl"
      />

      {profile.verified && (
        <Badge variant="success" className="gap-ds-1">
          <VerifiedIcon className="h-3.5 w-3.5" />
          Verified
        </Badge>
      )}

      <div className="flex w-full flex-col gap-ds-1">
        <h2 id="profile-name" className="truncate text-lg font-semibold text-text-primary">
          {profile.fullName}
        </h2>
        <p className="truncate text-sm text-text-secondary">@{profile.username}</p>
        <p className="text-xs text-text-muted">Member since {profile.memberSince}</p>
      </div>

      <Button variant="outline" size="md" className="min-h-ds-7 rounded-ds-lg px-ds-5">
        Edit Profile
      </Button>
    </section>
  );
}
