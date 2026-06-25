"use client";

import { useEffect, useState } from "react";
import type { UserProfile } from "@/lib/profile/types";
import type { UserRole } from "@/lib/supabase/types/database";
import type { AccountType } from "@/lib/profile/account";

export const GUEST_MOBILE_PROFILE: UserProfile = {
  id: "",
  fullName: "Guest",
  username: "guest",
  email: "",
  verified: false,
  memberSince: "",
  role: "buyer",
  accountType: "buyer",
  isSeller: false,
  isAdmin: false,
  isSuperAdmin: false,
  unreadMessages: 0,
  unreadNotifications: 0,
};

function roleToAccountType(role: UserRole): AccountType {
  if (role === "super_admin") return "super_admin";
  if (role === "admin") return "admin";
  if (role === "seller") return "seller";
  if (role === "business") return "business";
  return "buyer";
}

function mapRoleToProfile(
  data: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    avatarUrl: string | null;
  },
): UserProfile {
  const accountType = roleToAccountType(data.role);
  return {
    id: data.id,
    fullName: data.fullName,
    username: data.fullName.toLowerCase().replace(/\s+/g, "") || data.id.slice(0, 8),
    email: data.email,
    avatarUrl: data.avatarUrl,
    verified: false,
    memberSince: "",
    role: data.role,
    accountType,
    isSeller:
      accountType === "seller" ||
      accountType === "business" ||
      accountType === "admin" ||
      accountType === "super_admin",
    isAdmin: accountType === "admin" || accountType === "super_admin",
    isSuperAdmin: accountType === "super_admin",
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
