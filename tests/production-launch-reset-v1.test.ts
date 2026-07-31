import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PRODUCTION_LAUNCH_RESET_V1 } from "@/lib/launch/production-launch-reset-v1";

describe("Production Launch Reset v1.0", () => {
  it("SSOT forbids schema/migration/push/deploy/lock", () => {
    expect(PRODUCTION_LAUNCH_RESET_V1.forbidden).toEqual(
      expect.arrayContaining([
        "SCHEMA_CHANGES",
        "MIGRATIONS",
        "DROP_TABLES",
        "RECREATE_DATABASE",
        "GITHUB_PUSH",
        "VERCEL_PRODUCTION_DEPLOY",
        "PRODUCTION_LOCK",
      ]),
    );
  });

  it("keeps protected platform surfaces and Full Demo accounts", () => {
    expect(PRODUCTION_LAUNCH_RESET_V1.keep).toEqual(
      expect.arrayContaining([
        "categories",
        "taxonomy",
        "super_admin_accounts",
        "admin_accounts",
        "full_demo_accounts",
        "legal_documents",
        "help_centre",
        "platform_settings",
        "profiles",
      ]),
    );
    expect(PRODUCTION_LAUNCH_RESET_V1.fullDemoEmails).toEqual([
      "demo.buyer@rovexo.co.uk",
      "demo.seller@rovexo.co.uk",
    ]);
    expect(PRODUCTION_LAUNCH_RESET_V1.fullDemoWalletFloorGbp).toBe(50_000);
  });

  it("deletes marketplace operational tables and verifies zeros", () => {
    expect(PRODUCTION_LAUNCH_RESET_V1.deleteTablesInOrder).toEqual(
      expect.arrayContaining([
        "products",
        "orders",
        "offers",
        "messages",
        "notifications",
        "wallet_transactions",
        "reviews",
        "user_follows",
      ]),
    );
    expect(PRODUCTION_LAUNCH_RESET_V1.verificationZeroTables).toEqual(
      expect.arrayContaining(["products", "orders", "offers", "messages", "wallet_transactions"]),
    );
    // Children before parents
    const order = [...PRODUCTION_LAUNCH_RESET_V1.deleteTablesInOrder];
    expect(order.indexOf("messages")).toBeLessThan(order.indexOf("conversations"));
    expect(order.indexOf("order_items")).toBeLessThan(order.indexOf("orders"));
    expect(order.indexOf("orders")).toBeLessThan(order.indexOf("products"));
  });

  it("script is Owner-gated and defaults to dry-run", () => {
    const script = readFileSync(
      join(process.cwd(), "scripts/production-launch-reset-v1.ts"),
      "utf8",
    );
    expect(script).toContain("LAUNCH_RESET_OWNER_APPROVED");
    expect(script).toContain("LAUNCH_RESET_ALLOW_PRODUCTION_HOST");
    expect(script).toContain("DRY_RUN");
    expect(script).toContain("!args.has(\"--yes\")");
    expect(script).not.toContain("git push");
    expect(script).not.toContain("vercel deploy");
  });

  it("package.json wires launch:reset", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["launch:reset"]).toBe("npx tsx scripts/production-launch-reset-v1.ts");
  });
});
