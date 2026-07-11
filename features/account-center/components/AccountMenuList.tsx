"use client";

import { AccountMenuSections } from "@/features/account-center/components/AccountMenuSections";
import type { UserProfile } from "@/lib/profile/types";

type AccountMenuListProps = {
  profile: UserProfile;
  walletBalance?: number | null;
};

/** @deprecated Use AccountMenuSections — kept for legacy imports. */
export function AccountMenuList({ profile }: AccountMenuListProps) {
  return <AccountMenuSections profile={profile} />;
}
