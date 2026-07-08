"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import type { ProfileDetails } from "@/lib/profile/service";
import type { UserProfile } from "@/lib/profile/types";

type ProfileViewV1Props = {
  profile: UserProfile;
  details: ProfileDetails;
};

function formatMemberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function ProfileViewV1({ profile, details }: ProfileViewV1Props) {
  return (
    <AccountModuleShell title="My Profile" backHref="/account" version="v1.0">
      <div className="acm-profile" data-profile-version="v1.0">
        <div className="acm-profile__avatar-wrap">
          <div className="acm-profile__avatar">
            <Avatar
              src={details.avatarUrl}
              alt={profile.fullName}
              name={profile.fullName}
              size="xl"
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="acm-profile__name-row">
          <h2 className="acm-profile__name">{profile.fullName}</h2>
          {profile.verified ? (
            <span className="acm-profile__verified">
              <span aria-hidden>✓</span> Verified
            </span>
          ) : null}
        </div>
        <p className="acm-profile__email">{profile.email}</p>
        <p className="acm-profile__since">Member since {formatMemberSince(profile.memberSince)}</p>
      </div>

      <div className="acm-fields">
        <Link href="/account/profile/edit" className="acm-field">
          <span className="acm-field__label">Full Name</span>
          <span className="acm-field__value">{details.fullName}</span>
          <span className="acm-field__chevron">
            <ChevronRightLineIcon />
          </span>
        </Link>
        <Link href="/account/profile/edit" className="acm-field">
          <span className="acm-field__label">Email</span>
          <span className="acm-field__value">{details.email}</span>
          <span className="acm-field__chevron">
            <ChevronRightLineIcon />
          </span>
        </Link>
        <Link href="/account/profile/edit" className="acm-field">
          <span className="acm-field__label">Phone</span>
          <span className="acm-field__value">{details.phone || "Not set"}</span>
          <span className="acm-field__chevron">
            <ChevronRightLineIcon />
          </span>
        </Link>
        <Link href="/account/profile/edit" className="acm-field">
          <span className="acm-field__label">Location</span>
          <span className="acm-field__value">United Kingdom</span>
          <span className="acm-field__chevron">
            <ChevronRightLineIcon />
          </span>
        </Link>
        <Link href="/account/profile/edit" className="acm-field">
          <span className="acm-field__label">Bio</span>
          <span className="acm-field__value">{details.bio || "Add a bio"}</span>
          <span className="acm-field__chevron">
            <ChevronRightLineIcon />
          </span>
        </Link>
      </div>

      <div className="acm-cta">
        <Link href="/account/profile/edit" className="acm-cta__btn">
          Edit Profile
        </Link>
      </div>
    </AccountModuleShell>
  );
}
