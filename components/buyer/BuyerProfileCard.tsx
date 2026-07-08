"use client";

import { Avatar } from "@/components/ui/Avatar";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerProfileCard() {
  const { data } = useBuyerDashboard();
  const { profile, trust } = data;

  return (
    <div className="buyer-hero__top">
      <div className="buyer-hero__avatar">
        {profile.avatarUrl ? (
          <Avatar src={profile.avatarUrl} alt={profile.fullName} name={profile.fullName} size="xl" className="h-full w-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[rgb(147 51 234 / 0.08)] text-2xl font-bold text-[var(--ds-color-primary)]">
            {profile.fullName.charAt(0)}
          </div>
        )}
      </div>
      <div className="buyer-hero__meta">
        <h1 className="buyer-hero__name">{profile.fullName}</h1>
        <p className="buyer-hero__level">{trust?.progress.current ?? "Member"} buyer</p>
        {trust ? <p className="buyer-hero__trust">Trust score {trust.score.score}</p> : null}
        <p className="buyer-hero__since">Member since {profile.memberSince}</p>
        {profile.verified ? (
          <span className="buyer-hero__verified">
            <RovexoIcon icon={RovexoIcons.badges.verified} size={20} />
            Verified
          </span>
        ) : null}
      </div>
    </div>
  );
}
