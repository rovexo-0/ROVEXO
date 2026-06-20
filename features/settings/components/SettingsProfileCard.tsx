import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { VerifiedIcon } from "@/features/product-detail/icons";
import { ChevronRightIcon } from "@/features/dashboard/icons";
import type { UserProfile } from "@/lib/profile/types";

type SettingsProfileCardProps = {
  profile: UserProfile;
};

export function SettingsProfileCard({ profile }: SettingsProfileCardProps) {
  return (
    <Link href="/account" className="block">
      <Card
        padding="md"
        interactive
        className={cn("shadow-ds-soft", transitionFast, focusRing)}
      >
        <div className="flex min-h-[72px] items-center gap-ds-3">
          <Avatar
            src={profile.avatarUrl}
            alt={profile.fullName}
            name={profile.fullName}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-text-primary">{profile.fullName}</p>
            <p className="mt-0.5 truncate text-sm text-text-secondary">{profile.email}</p>
            {profile.verified && (
              <Badge variant="success" className="mt-ds-2 gap-ds-1">
                <VerifiedIcon className="h-3.5 w-3.5" />
                Verified
              </Badge>
            )}
          </div>

          <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
        </div>
      </Card>
    </Link>
  );
}
