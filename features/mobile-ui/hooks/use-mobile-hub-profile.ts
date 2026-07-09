"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/profile/types";
import type { UserRole } from "@/lib/supabase/types/database";
import { ROVEXO_ACCOUNT_KIND, resolveAccountCapabilities, resolveRovexoAccountKind } from "@/lib/profile/account";

export const GUEST_MOBILE_PROFILE: UserProfile = {
  id: "",
  fullName: "Guest",
  username: "guest",
  email: "",
  verified: false,
  memberSince: "",
  role: "buyer",
  accountKind: ROVEXO_ACCOUNT_KIND,
  accountType: ROVEXO_ACCOUNT_KIND,
  capabilities: resolveAccountCapabilities({
    role: "buyer",
    verified: false,
    hasSellerProfile: false,
    hasBusinessAccount: false,
  }),
  isSeller: false,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

function mapRoleToProfile(
  data: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    avatarUrl: string | null;
  },
): UserProfile {
  const accountKind = resolveRovexoAccountKind(data.role);
  const capabilities = resolveAccountCapabilities({
    role: data.role,
    verified: false,
    hasSellerProfile: false,
    hasBusinessAccount: data.role === "business",
  });

  return {
    id: data.id,
    fullName: data.fullName,
    username: data.fullName.toLowerCase().replace(/\s+/g, "") || data.id.slice(0, 8),
    email: data.email,
    avatarUrl: data.avatarUrl,
    verified: false,
    memberSince: "",
    role: data.role,
    accountKind,
    accountType: accountKind,
    capabilities,
    isSeller: capabilities.canSell,
    isAdmin: accountKind === "admin" || accountKind === "super_admin",
    isSuperAdmin: accountKind === "super_admin",
    unreadMessages: 0,
    unreadNotifications: 0,
  };
}

type UseMobileHubProfileResult = {
  profile: UserProfile;
  loading: boolean;
};

export function useMobileHubProfile(initial?: UserProfile): UseMobileHubProfileResult {
  const [profile, setProfile] = useState<UserProfile>(initial ?? GUEST_MOBILE_PROFILE);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;

    let cancelled = false;

    void fetch("/api/profile", { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          return GUEST_MOBILE_PROFILE;
        }
        const payload = (await response.json()) as {
          profile: {
            id: string;
            email: string;
            role: UserRole;
            fullName: string;
            avatarUrl: string | null;
          };
        };
        return mapRoleToProfile(payload.profile);
      })
      .then((next) => {
        if (!cancelled) {
          setProfile(next);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(GUEST_MOBILE_PROFILE);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initial]);

  return { profile: initial ?? profile, loading: initial ? false : loading };
}
