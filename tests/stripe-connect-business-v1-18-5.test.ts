import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Business Connect V2 on Stripe 20.1.0 / clover", () => {
  const connect = readFileSync(
    join(process.cwd(), "lib/stripe/connect.ts"),
    "utf8",
  );
  const onboarding = readFileSync(
    join(process.cwd(), "lib/business/business-onboarding-v1.ts"),
    "utf8",
  );
  const server = readFileSync(
    join(process.cwd(), "lib/stripe/server.ts"),
    "utf8",
  );
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
  ) as { dependencies: { stripe: string } };

  it("locks one Stripe SDK and clover API version", () => {
    expect(pkg.dependencies.stripe).toBe("20.1.0");
    expect(server).toContain('apiVersion: "2025-12-15.clover"');
    expect(server).not.toContain("2025-08-27.basil");
  });

  it("uses V2 accounts + accountLinks only", () => {
    expect(connect).toContain("stripe.v2.core.accounts.create");
    expect(connect).toContain("stripe.v2.core.accountLinks.create");
    expect(connect).toContain("stripe.v2.core.accounts.retrieve");
    expect(onboarding).toContain("stripe.v2.core.accounts.retrieve");
    expect(connect).not.toMatch(/stripe\.accounts\.create\(/);
    expect(connect).not.toMatch(/stripe\.accountLinks\.create\(/);
  });

  it("creates a distinct Business recipient account", () => {
    expect(connect).toContain('sellerContext: normalized');
    expect(connect).toContain('entity_type: "company"');
    expect(connect).toContain("stripe_connect_account_id_business");
    expect(connect).toContain('configurations: ["recipient"]');
  });

  it("accepts Business return/refresh URLs", () => {
    expect(connect).toContain("ConnectAccountLinkOptions");
    expect(connect).toContain("/wallet/bank-accounts?sellerContext=business&connect=success");
    expect(onboarding).toContain('createConnectAccountLink(userId, "business"');
  });
});
