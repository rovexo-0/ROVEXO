import { afterEach, describe, expect, it } from "vitest";
import {
  MISSING_REQUIRED_SECRET,
  OWNER_CONTROLLED_SECRET_KEYS,
  assertWalletMoneyEnv,
  readWalletEnvFilePresence,
  validateWalletMoneyEnv,
} from "@/lib/wallet/env-validation";
import { evaluateWalletCertificationLocal } from "@/lib/wallet/certification";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

describe("Wallet env validation — fail closed", () => {
  const original = {
    stripe: process.env.STRIPE_SECRET_KEY,
    webhook: process.env.STRIPE_WEBHOOK_SECRET,
    service: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bank: process.env.BANK_DETAILS_ENCRYPTION_KEY,
    app: process.env.NEXT_PUBLIC_APP_URL,
    site: process.env.NEXT_PUBLIC_SITE_URL,
    virtual: process.env.ROVEXO_VIRTUAL_WALLET,
  };

  afterEach(() => {
    setEnv("STRIPE_SECRET_KEY", original.stripe);
    setEnv("STRIPE_WEBHOOK_SECRET", original.webhook);
    setEnv("SUPABASE_SERVICE_ROLE_KEY", original.service);
    setEnv("BANK_DETAILS_ENCRYPTION_KEY", original.bank);
    setEnv("NEXT_PUBLIC_APP_URL", original.app);
    setEnv("NEXT_PUBLIC_SITE_URL", original.site);
    setEnv("ROVEXO_VIRTUAL_WALLET", original.virtual);
  });

  it("returns MISSING REQUIRED SECRET when Stripe secret absent for withdraw", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.ROVEXO_VIRTUAL_WALLET;
    process.env.BANK_DETAILS_ENCRYPTION_KEY =
      original.bank || Buffer.alloc(32, 7).toString("base64");
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test-key-not-real";

    const result = validateWalletMoneyEnv("withdraw");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(MISSING_REQUIRED_SECRET);
      expect(result.missing).toContain("STRIPE_SECRET_KEY");
      expect(result.ownerControlledMissing).toContain("STRIPE_SECRET_KEY");
    }
    expect(() => assertWalletMoneyEnv("withdraw")).toThrow(MISSING_REQUIRED_SECRET);
  });

  it("blocks webhooks without webhook + stripe + service role secrets", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

    const result = validateWalletMoneyEnv("webhook");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe(MISSING_REQUIRED_SECRET);
      expect(result.missing.length).toBeGreaterThan(0);
    }
  });

  it("lists Owner-controlled secrets without inventing values", () => {
    expect(OWNER_CONTROLLED_SECRET_KEYS).toEqual([
      "SUPABASE_SERVICE_ROLE_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ]);
  });

  it("wires MISSING REQUIRED SECRET into withdraw API and Stripe webhook", () => {
    const withdraw = readFileSync(join(process.cwd(), "app/api/wallet/withdraw/route.ts"), "utf8");
    const webhook = readFileSync(join(process.cwd(), "app/api/stripe/webhook/route.ts"), "utf8");
    expect(withdraw).toContain("MISSING_REQUIRED_SECRET");
    expect(webhook).toContain("MISSING_REQUIRED_SECRET");
    expect(withdraw).toContain("isWalletMoneyEnvReady");
    expect(webhook).toContain("isWalletMoneyEnvReady");
  });
});

describe("Wallet final certification snapshot", () => {
  it("reports the current local implementation snapshot with Production Owner-action only", () => {
    const report = evaluateWalletCertificationLocal();
    expect(["100%", "INCOMPLETE"]).toContain(report.implementation);
    expect(report.certification).toBe(report.implementation === "100%" ? "PASS" : "FAIL");
    expect(report.production).toBe("OWNER_ACTION_REQUIRED");
    expect(report.readyForImplementation).toBe(report.implementation === "100%");
    expect(report.readyForCommit).toBe(false);
    expect(report.readyForPush).toBe(false);
    expect(report.readyForDeploy).toBe(false);
    expect(report.readyForProduction).toBe(false);
    expect(report.productionCertified).toBe(false);
    expect(report.missingRequiredSecretMessage).toBe(MISSING_REQUIRED_SECRET);

    const filePresence = readWalletEnvFilePresence();
    const expectedOwnerMissing = OWNER_CONTROLLED_SECRET_KEYS.filter((k) => !filePresence[k]);
    expect(report.ownerControlledMissing).toEqual([...expectedOwnerMissing]);
    // Live migration / payout E2E remain Owner-action regardless of env presence.
    expect(
      report.gates.some((g) => g.id === "migration_applied_live" && g.status === "OWNER_ACTION_REQUIRED"),
    ).toBe(true);
  });
});
