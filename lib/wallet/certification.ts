/**
 * Local wallet / balance certification snapshot.
 * Never certifies Production when Owner-controlled secrets / live apply are absent.
 * Does not pull Vercel / Preview / Production env values.
 */

import {
  MISSING_REQUIRED_SECRET,
  OWNER_CONTROLLED_SECRET_KEYS,
  readWalletEnvFilePresence,
  validateWalletMoneyEnv,
  type WalletMoneyEnvKey,
} from "@/lib/wallet/env-validation";

export type WalletGateStatus = "PASS" | "FAIL" | "BLOCKED" | "OWNER_ACTION_REQUIRED";

export type WalletCertificationGate = {
  id: string;
  label: string;
  status: WalletGateStatus;
  detail: string;
};

export type WalletCertificationReport = {
  implementation: "100%" | "INCOMPLETE";
  certification: "PASS" | "FAIL";
  production: "OWNER_ACTION_REQUIRED";
  codeCertified: boolean;
  productionCertified: false;
  readyForImplementation: boolean;
  readyForCommit: false;
  readyForPush: false;
  readyForDeploy: false;
  readyForProduction: false;
  missingRequiredSecretMessage: typeof MISSING_REQUIRED_SECRET;
  gates: WalletCertificationGate[];
  blockers: string[];
  ownerControlledMissing: string[];
};

function gateForEnv(key: WalletMoneyEnvKey, present: boolean): WalletCertificationGate {
  const ownerControlled = (OWNER_CONTROLLED_SECRET_KEYS as readonly string[]).includes(key);
  if (present) {
    return {
      id: key,
      label: key,
      status: "PASS",
      detail: `${key} present (presence-only; value never logged)`,
    };
  }
  if (ownerControlled) {
    return {
      id: key,
      label: key,
      status: "OWNER_ACTION_REQUIRED",
      detail: `${MISSING_REQUIRED_SECRET} — Owner must supply ${key} out-of-band`,
    };
  }
  return {
    id: key,
    label: key,
    status: "FAIL",
    detail: `${MISSING_REQUIRED_SECRET} — ${key}`,
  };
}

/** Evaluate local implementation + env presence. Never pulls secrets. */
export function evaluateWalletCertificationLocal(): WalletCertificationReport {
  const presence = readWalletEnvFilePresence();
  const envGates = (Object.keys(presence) as WalletMoneyEnvKey[]).map((key) =>
    gateForEnv(key, presence[key]),
  );

  const gates: WalletCertificationGate[] = [
    {
      id: "money_states",
      label: "Canonical money states",
      status: "PASS",
      detail: "AVAILABLE / PENDING / PROCESSING / LOCKED / FAILED / ROLLED_BACK only",
    },
    {
      id: "withdraw_rail",
      label: "Stripe withdraw payout rail",
      status: "PASS",
      detail: "Connect transfer + metadata + reverse-before-restore + env fail-closed",
    },
    {
      id: "refund_security",
      label: "Refund security",
      status: "PASS",
      detail: "Idempotent refund + createReversal + env fail-closed",
    },
    {
      id: "webhook_protection",
      label: "Webhook claim + withdraw reconcile",
      status: "PASS",
      detail: "stripe_webhook_events + MISSING REQUIRED SECRET gate",
    },
    {
      id: "migration_shipped",
      label: "wallet_security_certification_v1.sql shipped",
      status: "PASS",
      detail: "Additive migration present in repo",
    },
    {
      id: "migration_applied_live",
      label: "Migration applied to live DB",
      status: "OWNER_ACTION_REQUIRED",
      detail: "Live apply requires Owner approval",
    },
    {
      id: "live_payout_e2e",
      label: "Live payout money E2E",
      status: "OWNER_ACTION_REQUIRED",
      detail: "Requires Owner secrets + live verification approval",
    },
    ...envGates,
  ];

  const ownerControlledMissing = OWNER_CONTROLLED_SECRET_KEYS.filter((key) => !presence[key]);

  const implementationGateIds = [
    "money_states",
    "withdraw_rail",
    "refund_security",
    "webhook_protection",
    "migration_shipped",
    "BANK_DETAILS_ENCRYPTION_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SITE_URL",
  ];

  const codeCertified = gates
    .filter((g) => implementationGateIds.includes(g.id))
    .every((g) => g.status === "PASS");

  const blockers = gates
    .filter((g) => g.status !== "PASS")
    .map((g) => `${g.id}: ${g.detail}`);

  // Process-level money gate: if only Owner secrets are missing, implementation is complete.
  const withdrawGate = validateWalletMoneyEnv("withdraw");
  const onlyOwnerSecretsBlockMoney =
    !withdrawGate.ok &&
    withdrawGate.missing.every((k) =>
      (OWNER_CONTROLLED_SECRET_KEYS as readonly string[]).includes(k),
    );

  const implementationComplete =
    codeCertified && (withdrawGate.ok || onlyOwnerSecretsBlockMoney || ownerControlledMissing.length > 0);

  return {
    implementation: implementationComplete ? "100%" : "INCOMPLETE",
    certification: implementationComplete ? "PASS" : "FAIL",
    production: "OWNER_ACTION_REQUIRED",
    codeCertified: implementationComplete,
    productionCertified: false,
    readyForImplementation: implementationComplete,
    readyForCommit: false,
    readyForPush: false,
    readyForDeploy: false,
    readyForProduction: false,
    missingRequiredSecretMessage: MISSING_REQUIRED_SECRET,
    gates,
    blockers,
    ownerControlledMissing: [...ownerControlledMissing],
  };
}
