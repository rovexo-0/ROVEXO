import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { BusinessStatusSnapshot } from "@/lib/business/business-onboarding-contract-v1";
import { PWA_BUSINESS_QUICK_ACTIONS } from "@/lib/business/pwa-business-menu-v1";
import "@/styles/rovexo/business-onboarding-v1.css";

function formatGbp(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

type BusinessHomeScreenProps = {
  status: BusinessStatusSnapshot;
  storeHref: string;
};

export function BusinessHomeScreen({ status, storeHref }: BusinessHomeScreenProps) {
  const name = status.identity.businessName || status.identity.username || "Business";
  const wallet = status.wallet;
  const total =
    wallet == null ? null : wallet.availableBalance + wallet.pendingBalance;
  const rating = Number.isFinite(status.identity.rating)
    ? status.identity.rating.toFixed(1)
    : "—";

  return (
    <div className="biz-home" data-business-home="v1">
      <div className="biz-home__identity">
        <Avatar
          src={status.identity.avatarUrl}
          alt={name}
          name={name}
          size="lg"
        />
        <div className="biz-home__identity-copy">
          <div className="biz-home__name-row">
            <h1 className="biz-home__name">{name}</h1>
            {status.identity.verified ? (
              <span aria-label="Verified by Stripe">✅</span>
            ) : null}
          </div>
          <Link href={storeHref} className="biz-home__store">
            View Store &gt;
          </Link>
          <p className="biz-home__stats">
            {rating} ({status.identity.reviewCount}) • {status.identity.positivePercent}% positive •{" "}
            {status.identity.soldCount} sold
          </p>
        </div>
        <Link href="/business/menu" className="biz-home__menu-btn" aria-label="Business menu">
          ☰
        </Link>
      </div>

      <section className="biz-home__balance" aria-label="Business balance">
        <p className="biz-home__balance-label">Business balance</p>
        <p className="biz-home__balance-total">{formatGbp(total)}</p>
        <div className="biz-home__balance-split">
          <span className="biz-home__available">Available: {formatGbp(wallet?.availableBalance)}</span>
          <span className="biz-home__pending">Pending: {formatGbp(wallet?.pendingBalance)}</span>
        </div>
      </section>

      <div className="biz-home__actions">
        {PWA_BUSINESS_QUICK_ACTIONS.map((action) => {
          const href = action.id === "store" ? storeHref : action.href;
          return (
            <Link key={action.id} href={href} className="biz-home__action">
              <span className="biz-home__action-emoji" aria-hidden>
                {action.emoji}
              </span>
              <span className="biz-home__action-title">{action.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
