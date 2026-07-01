import Link from "next/link";
import { RovexoGlassIcon } from "@/components/icons/RovexoGlassIcon";
import { RovexoIcons } from "@/lib/icons";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { TrustDashboardData } from "@/lib/trust/types";

type AccountTrustCardProps = {
  trustData: TrustDashboardData;
};

function tierStars(tier: string): number {
  switch (tier) {
    case "diamond":
    case "platinum":
      return 5;
    case "gold":
      return 4;
    case "silver":
      return 3;
    default:
      return 2;
  }
}

export function AccountTrustCard({ trustData }: AccountTrustCardProps) {
  const fill = Math.max(0, Math.min(100, trustData.score.score));
  const stars = tierStars(trustData.score.tier);
  const reviewCount =
    trustData.factors.positiveReviews + trustData.factors.negativeReviews;

  return (
    <Link
      href="/trust"
      className={cn("account-center-trust", focusRing)}
      aria-label={`Trust score ${trustData.score.score}. View Trust Centre.`}
    >
      <p className="account-center-trust__label">Trust Score</p>
      <div className="account-center-trust__score-row">
        <p className="account-center-trust__score">{trustData.score.score}</p>
        <RovexoGlassIcon icon={RovexoIcons.security.shield} size={22} className="text-primary" />
      </div>
      <div className="account-center-trust__stars" aria-label={`${stars} star trust tier`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} aria-hidden>
            {index < stars ? "★" : "☆"}
          </span>
        ))}
      </div>
      {reviewCount > 0 ? (
        <p className="account-center-trust__reviews">{reviewCount} reviews</p>
      ) : null}
      {trustData.factors.completedSales > 0 ? (
        <p className="account-center-trust__sales">{trustData.factors.completedSales} sales</p>
      ) : null}
      <div
        className="account-center-trust__meter"
        role="progressbar"
        aria-valuenow={trustData.score.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="account-center-trust__meter-fill" style={{ width: `${fill}%` }} />
      </div>
    </Link>
  );
}
