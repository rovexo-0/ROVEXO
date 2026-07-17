import { DEMO_USERS } from "@/lib/demo-environment/config";
import { FULL_DEMO_ACCOUNTS } from "@/lib/full-demo/canonical";
import type { DemoCertificationAccount, DemoCertificationRole } from "@/lib/launch-certification/types";

/** Canonical production demo roles — same permissions as real users, no admin shortcuts. */
export const LAUNCH_DEMO_ACCOUNT_ROLES: DemoCertificationRole[] = [
  "buyer",
  "seller",
  "admin",
  "super_admin",
];

/** Buyer/Seller certification map to permanent Full Demo Accounts. */
const ROLE_TO_DEMO_KEY: Record<DemoCertificationRole, string> = {
  buyer: "live-buyer",
  seller: "live-seller",
  admin: "admin",
  super_admin: "superadmin",
};

export function resolveLaunchDemoAccount(role: DemoCertificationRole): DemoCertificationAccount {
  const demoUserKey = ROLE_TO_DEMO_KEY[role];
  const fullDemo = FULL_DEMO_ACCOUNTS.find((entry) => entry.key === demoUserKey);
  const user = DEMO_USERS.find((entry) => entry.key === demoUserKey);
  if (!user) {
    throw new Error(`Launch demo account not configured for role: ${role}`);
  }

  const labels: Record<DemoCertificationRole, string> = {
    buyer: fullDemo?.label ?? "ROVEXO LIVE BUYER",
    seller: fullDemo?.label ?? "ROVEXO LIVE SELLER",
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
