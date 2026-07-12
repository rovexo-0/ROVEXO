import { DEMO_USERS } from "@/lib/demo-environment/config";
import type { DemoCertificationAccount, DemoCertificationRole } from "@/lib/launch-certification/types";

/** Canonical production demo roles — same permissions as real users, no admin shortcuts. */
export const LAUNCH_DEMO_ACCOUNT_ROLES: DemoCertificationRole[] = [
  "buyer",
  "seller",
  "admin",
  "super_admin",
];

const ROLE_TO_DEMO_KEY: Record<DemoCertificationRole, string> = {
  buyer: "buyer01",
  seller: "seller01",
  admin: "admin",
  super_admin: "superadmin",
};

export function resolveLaunchDemoAccount(role: DemoCertificationRole): DemoCertificationAccount {
  const demoUserKey = ROLE_TO_DEMO_KEY[role];
  const user = DEMO_USERS.find((entry) => entry.key === demoUserKey);
  if (!user) {
    throw new Error(`Launch demo account not configured for role: ${role}`);
  }

  const labels: Record<DemoCertificationRole, string> = {
    buyer: "Buyer Demo",
    seller: "Seller Demo",
    admin: "Admin Demo",
    super_admin: "Super Admin",
  };

  return {
    role,
    label: labels[role],
    demoUserKey,
    email: user.email,
  };
}

export function listLaunchDemoAccounts(): DemoCertificationAccount[] {
  return LAUNCH_DEMO_ACCOUNT_ROLES.map(resolveLaunchDemoAccount);
}
