"use client";

import Link from "next/link";
import { PremiumAccountIcon } from "@/components/icons/PremiumAccountIcon";
import { ACCOUNT_QUICK_ACCESS_PREMIUM } from "@/lib/account-center/quick-access-premium";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

/**
 * ROVEXO v1.0 — My Account grid (approved layout).
 * Fixed 3×3 grid of premium 3D destinations. Row 3 keeps an empty centre slot
 * so Settings and Help sit in the outer columns. Compact ~110px cards.
 */
export function AccountQuickAccessPremium() {
  const items = ACCOUNT_QUICK_ACCESS_PREMIUM;
  const leading = items.slice(0, items.length - 1);
  const last = items[items.length - 1];

  return (
    <section className="ac2-account-section" aria-labelledby="ac2-account-title">
      <h2 id="ac2-account-title" className="ac2-account-section__title">
        My Account
      </h2>
      <div className="ac2-account-grid">
        {leading.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn("ac2-account-card", focusRing)}
            aria-label={item.label}
          >
            <span className="ac2-account-card__icon">
              <PremiumAccountIcon icon={item.icon} size={40} />
            </span>
            <span className="ac2-account-card__label">{item.label}</span>
          </Link>
        ))}
        <div className="ac2-account-card--empty" aria-hidden />
        {last ? (
          <Link
            href={last.href}
            className={cn("ac2-account-card", focusRing)}
            aria-label={last.label}
          >
            <span className="ac2-account-card__icon">
              <PremiumAccountIcon icon={last.icon} size={40} />
            </span>
            <span className="ac2-account-card__label">{last.label}</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
