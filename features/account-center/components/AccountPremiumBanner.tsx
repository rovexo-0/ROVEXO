"use client";

import { RovexoLogo3D } from "@/components/brand/RovexoLogo3D";
import { PremiumAccountIcon } from "@/components/icons/PremiumAccountIcon";
import type { AccountPremiumIconKey } from "@/lib/account-center/premium-icons";

const FLOATING: { icon: AccountPremiumIconKey; slot: string }[] = [
  { icon: "shopping", slot: "1" },
  { icon: "wallet", slot: "2" },
  { icon: "security", slot: "3" },
  { icon: "analytics", slot: "4" },
  { icon: "marketplace", slot: "5" },
];

/**
 * ROVEXO v1.0 — Premium marketplace banner (spec §NEW ROVEXO PREMIUM BANNER).
 * Dark-blue gradient + glassmorphism, a glowing 3D ROVEXO mark, animated light
 * reflections, and floating marketplace icons. Decorative only.
 */
export function AccountPremiumBanner() {
  return (
    <section className="ac2-banner" aria-label="ROVEXO marketplace">
      <div className="ac2-banner__glass" aria-hidden />
      <div className="ac2-banner__sheen" aria-hidden />

      <div className="ac2-banner__floats" aria-hidden>
        {FLOATING.map(({ icon, slot }) => (
          <span key={icon} className={`ac2-banner__float ac2-banner__float--${slot}`}>
            <PremiumAccountIcon icon={icon} size={34} />
          </span>
        ))}
      </div>

      <div className="ac2-banner__content">
        <span className="ac2-banner__logo" aria-hidden>
          <RovexoLogo3D />
        </span>
        <div className="ac2-banner__copy">
          <p className="ac2-banner__title">ROVEXO</p>
          <p className="ac2-banner__tagline">The 2026 Marketplace</p>
        </div>
      </div>
    </section>
  );
}
