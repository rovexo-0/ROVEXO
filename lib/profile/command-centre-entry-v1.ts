/**
 * My Profile — Admin / Super Admin Command Centre entry (RC1).
 * Visibility is role + own-profile only. Server layouts / middleware enforce access.
 */

import type { UserRole } from "@/lib/supabase/types/database";
import { isSuperAdmin } from "@/lib/auth/roles";

export const PROFILE_COMMAND_CENTRE_ENTRY_V1 = {
  id: "profile-command-centre-entry-v1",
  version: "1.0.0",
  status: "RC1",
} as const;

export type ProfileCommandCentreEntry = {
  kind: "super_admin" | "admin";
  href: "/super-admin" | "/admin";
  label: string;
  badge: string;
  ariaLabel: string;
};

/**
 * Fail closed: only own profile · SUPER_ADMIN → Super Admin CTA · ADMIN → Admin CTA.
 * Super Admin never sees the Admin button. Buyers/sellers/business/guests → null.
 */
export function resolveProfileCommandCentreEntry(input: {
  isOwnProfile: boolean;
  role: UserRole | null | undefined;
}): ProfileCommandCentreEntry | null {
  if (!input.isOwnProfile || !input.role) return null;

  if (isSuperAdmin(input.role)) {
    return {
      kind: "super_admin",
      href: "/super-admin",
      label: "Super Admin Command Centre",
      badge: "SUPER ADMIN",
      ariaLabel: "Open Super Admin Command Centre",
    };
  }

  if (input.role === "admin") {
    return {
      kind: "admin",
      href: "/admin",
      label: "Admin Command Centre",
      badge: "ADMIN",
      ariaLabel: "Open Admin Command Centre",
    };
  }

  return null;
}
