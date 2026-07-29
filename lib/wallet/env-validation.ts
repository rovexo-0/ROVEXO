/**
 * ROVEXO Wallet / Balance — fail-closed environment validation.
 *
 * Never invents, generates, placeholders, or pulls Vercel/production secrets.
 * If a required secret is missing → STOP money movement.
 */

import { existsSync, readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import { mustUseVirtualPayments, mustUseVirtualWallet } from "@/lib/full-demo/security";
import { isBankEncryptionConfigured } from "@/lib/wallet/crypto";
import { isStripeConfigured } from "@/lib/stripe/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/env";

/** Canonical fail-closed message — never reveal which secret or its value. */
export const MISSING_REQUIRED_SECRET = "MISSING REQUIRED SECRET";

/** All wallet money env names under validation. */
export const WALLET_MONEY_ENV_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "BANK_DETAILS_ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SITE_URL",
] as const;

export type WalletMoneyEnvKey = (typeof WALLET_MONEY_ENV_KEYS)[number];

/** Owner must supply these out-of-band. Never retrieve. */
export const OWNER_CONTROLLED_SECRET_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;

export type OwnerControlledSecretKey = (typeof OWNER_CONTROLLED_SECRET_KEYS)[number];

export type WalletEnvPresence = Record<WalletMoneyEnvKey, boolean>;

export type WalletEnvValidationResult =
  | { ok: true; virtual: boolean }
  | {
      ok: false;
      message: typeof MISSING_REQUIRED_SECRET;
      missing: WalletMoneyEnvKey[];
      ownerControlledMissing: OwnerControlledSecretKey[];
    };

function envValuePresent(name: string): boolean {
  const live = process.env[name]?.trim();
  if (live && live !== "[SENSITIVE]" && !live.startsWith("[SEN") && live !== "placeholder") {
    if (live.endsWith("_placeholder")) return false;
    if (live === "sk_test_placeholder" || live === "whsec_placeholder") return false;
    return true;
  }
  return false;
}

/** Presence-only (process.env). Never reads or returns secret values. */
export function readWalletEnvPresence(): WalletEnvPresence {
  return {
    SUPABASE_SERVICE_ROLE_KEY:
      envValuePresent("SUPABASE_SERVICE_ROLE_KEY") ||
      envValuePresent("SUPABASE_SECRET_KEY") ||
      isSupabaseAdminConfigured(),
    STRIPE_SECRET_KEY: envValuePresent("STRIPE_SECRET_KEY") || isStripeConfigured(),
    STRIPE_WEBHOOK_SECRET: envValuePresent("STRIPE_WEBHOOK_SECRET"),
    BANK_DETAILS_ENCRYPTION_KEY:
      envValuePresent("BANK_DETAILS_ENCRYPTION_KEY") || isBankEncryptionConfigured(),
    NEXT_PUBLIC_APP_URL:
      envValuePresent("NEXT_PUBLIC_APP_URL") || envValuePresent("NEXT_PUBLIC_SITE_URL"),
    NEXT_PUBLIC_SITE_URL:
      envValuePresent("NEXT_PUBLIC_SITE_URL") || envValuePresent("NEXT_PUBLIC_APP_URL"),
  };
}

/**
 * File presence-only for local certification reports.
 * Reads .env.local key names only — never logs values. Never pulls Vercel.
 */
export function readWalletEnvFilePresence(): WalletEnvPresence {
  const fromProcess = readWalletEnvPresence();
  const localPath = workspacePath( ".env.local");
  if (!existsSync(localPath)) {
    return fromProcess;
  }
  const raw = readFileSync(localPath, "utf8");
  const fileHas = (name: string) => new RegExp(`^${name}=\\S`, "m").test(raw);

  return {
    SUPABASE_SERVICE_ROLE_KEY:
      fromProcess.SUPABASE_SERVICE_ROLE_KEY ||
      fileHas("SUPABASE_SERVICE_ROLE_KEY") ||
      fileHas("SUPABASE_SECRET_KEY"),
    STRIPE_SECRET_KEY: fromProcess.STRIPE_SECRET_KEY || fileHas("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: fromProcess.STRIPE_WEBHOOK_SECRET || fileHas("STRIPE_WEBHOOK_SECRET"),
    BANK_DETAILS_ENCRYPTION_KEY:
      fromProcess.BANK_DETAILS_ENCRYPTION_KEY || fileHas("BANK_DETAILS_ENCRYPTION_KEY"),
    NEXT_PUBLIC_APP_URL:
      fromProcess.NEXT_PUBLIC_APP_URL || fileHas("NEXT_PUBLIC_APP_URL") || fileHas("NEXT_PUBLIC_SITE_URL"),
    NEXT_PUBLIC_SITE_URL:
      fromProcess.NEXT_PUBLIC_SITE_URL || fileHas("NEXT_PUBLIC_SITE_URL") || fileHas("NEXT_PUBLIC_APP_URL"),
  };
}

export type MoneyMovementKind = "withdraw" | "refund" | "webhook" | "bank_encrypt" | "sale_payout";

/**
 * Fail-closed gate before any money movement.
 * Virtual / Full Demo may skip live Stripe secrets but never invents them.
 */
export function validateWalletMoneyEnv(kind: MoneyMovementKind): WalletEnvValidationResult {
  const presence = readWalletEnvPresence();
  // Virtual wallet OR virtual payments (Full Demo / cert) — never require live Stripe.
  const virtual = mustUseVirtualWallet() || mustUseVirtualPayments();
  const required: WalletMoneyEnvKey[] = [];

  // Public URLs always required for wallet money surfaces.
  required.push("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL");

  // Admin ledger always required for money movement (except pure encrypt of new bank details).
  if (kind !== "bank_encrypt") {
    required.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  if (kind === "bank_encrypt") {
    required.push("BANK_DETAILS_ENCRYPTION_KEY");
  }

  if (kind === "withdraw") {
    required.push("BANK_DETAILS_ENCRYPTION_KEY");
    if (!virtual) {
      required.push("STRIPE_SECRET_KEY");
    }
  }

  if (kind === "refund" || kind === "sale_payout") {
    if (!virtual) {
      required.push("STRIPE_SECRET_KEY");
    }
  }

  if (kind === "webhook") {
    // Webhooks are live Stripe only — never process without signing secret + admin.
    required.push("STRIPE_WEBHOOK_SECRET", "STRIPE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
  }

  const missing = [...new Set(required)].filter((key) => !presence[key]);
  if (missing.length === 0) {
    return { ok: true, virtual };
  }

  const ownerControlledMissing = missing.filter((key): key is OwnerControlledSecretKey =>
    (OWNER_CONTROLLED_SECRET_KEYS as readonly string[]).includes(key),
  );

  return {
    ok: false,
    message: MISSING_REQUIRED_SECRET,
    missing,
    ownerControlledMissing,
  };
}

/** Throws with MISSING REQUIRED SECRET when validation fails. */
export function assertWalletMoneyEnv(kind: MoneyMovementKind): void {
  const result = validateWalletMoneyEnv(kind);
  if (!result.ok) {
    throw new Error(MISSING_REQUIRED_SECRET);
  }
}

/** Soft gate — returns false instead of throwing (store / API safe). */
export function isWalletMoneyEnvReady(kind: MoneyMovementKind): boolean {
  return validateWalletMoneyEnv(kind).ok;
}
