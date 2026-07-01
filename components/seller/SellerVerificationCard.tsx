"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerVerificationCard() {
  const { data } = useSellerDashboard();
  const { trust, profile } = data;

  return (
    <SellerSection id="seller-verification" title="Verification" href="/seller/trust">
      <div className="seller-card">
        {profile.verified ? (
          <span className="seller-hero__verified">
            <RovexoIcon icon={RovexoIcons.badges.verified} size={20} />
            Verified seller
          </span>
        ) : (
          <p className="seller-list-row__meta">Complete verification to unlock buyer trust.</p>
        )}
        {trust ? (
          <p className="seller-list-row__meta seller-list-row__meta--spaced">
            Trust tier {trust.progress.current} · score {trust.score.score}
          </p>
        ) : null}
        <Link href="/seller/trust" className="seller-section__link seller-section__link--inline">
          Open trust center
        </Link>
      </div>
    </SellerSection>
  );
}
