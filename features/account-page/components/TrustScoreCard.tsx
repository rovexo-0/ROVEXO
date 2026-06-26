import Link from "next/link";
import { Shield } from "lucide-react";
import type { TrustDashboardData } from "@/lib/trust/types";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

type TrustScoreCardProps = {
  trustData: TrustDashboardData;
};

export function TrustScoreCard({ trustData }: TrustScoreCardProps) {
  const fill = Math.max(0, Math.min(100, trustData.score.score));

  return (
    <Link
      href="/trust"
      className={cn("account-trust-card", focusRing)}
      aria-label={`Trust Score ${trustData.score.score}. View Trust Centre.`}
    >
      <div>
        <p className="account-trust-card__label">Trust Score</p>
        <div className="account-trust-card__score-row">
          <p className="account-trust-card__score">{trustData.score.score}</p>
          <Shield className="account-trust-card__shield" size={28} strokeWidth={1.75} aria-hidden />
        </div>
        <p className="account-trust-card__tier">{trustData.score.tier} trust</p>
      </div>
      <div
        className="account-trust-card__meter"
        role="progressbar"
        aria-valuenow={trustData.score.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="account-trust-card__meter-fill" style={{ width: `${fill}%` }} />
      </div>
    </Link>
  );
}
