import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Rating } from "@/components/ui/Rating";
import { VerifiedIcon } from "@/features/product-detail/icons";
import type { UserProfile } from "@/lib/profile/types";

type SellerProfileCardProps = {
  profile: UserProfile;
  sellerRating: number;
  reviewCount: number;
  activeListings: number;
};

export function SellerProfileCard({
  profile,
  sellerRating,
  reviewCount,
  activeListings,
}: SellerProfileCardProps) {
  return (
    <Card padding="md" className="">
      <div className="flex items-start gap-ds-3">
        <Avatar
          src={profile.avatarUrl}
          alt={profile.fullName}
          name={profile.fullName}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text-primary">{profile.fullName}</h2>

          {profile.verified && (
            <Badge variant="success" className="mt-ds-2 gap-ds-1">
              <VerifiedIcon className="h-3.5 w-3.5" />
              Verified Seller
            </Badge>
          )}

          <div className="mt-ds-2">
            <Rating value={sellerRating} reviewCount={reviewCount} size="sm" />
          </div>

          <p className="mt-ds-2 text-xs text-text-secondary">
            {activeListings} Active Listings
          </p>
        </div>
      </div>

      <Link href="/account" className="mt-ds-4 block">
        <Button variant="outline" fullWidth size="md" className="min-h-ds-7 rounded-ds-lg">
          View Profile
        </Button>
      </Link>
    </Card>
  );
}
