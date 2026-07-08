"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { useSellerDashboard } from "@/hooks/seller";

function formatResponseTime(minutes: number) {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

export function SellerHeroCard() {
  const { data } = useSellerDashboard();
  const { profile, trust, statistics } = data;

  return (
    <section className="seller-hero" aria-label="Seller store profile">
      <div className="seller-hero__top">
        <div className="seller-hero__avatar">
          {profile.avatarUrl ? (
            <Avatar src={profile.avatarUrl} alt={profile.fullName} name={profile.fullName} size="xl" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#ecfdf5] text-2xl font-bold text-[#0f766e]">
              {data.storeName.charAt(0)}
            </div>
          )}
        </div>
        <div className="seller-hero__meta">
          <h1 className="seller-hero__name">{data.storeName}</h1>
          <p className="seller-hero__rank">{data.sellerRank} seller</p>
          {trust ? <p className="seller-hero__line">Trust score {trust.score.score}</p> : null}
          <p className="seller-hero__line">{statistics.followers} followers · {data.reviews.averageRating.toFixed(1)} rating</p>
          <p className="seller-hero__line">Response time {formatResponseTime(data.responseTimeMinutes)}</p>
          <p className="seller-hero__line">Active since {data.activeSince}</p>
          {profile.verified ? (
            <span className="seller-hero__verified">
              <RovexoIcon icon={RovexoIcons.badges.verified} size={20} />
              Verified seller
            </span>
          ) : null}
        </div>
      </div>
      <Link href="/account/profile" className="seller-hero__cta">
        Edit store
      </Link>
    </section>
  );
}
