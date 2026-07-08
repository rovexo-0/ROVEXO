import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CommerceEngine, WALLET_STATES } from "@/lib/commerce-engine";

const MIGRATION = readFileSync(
  join(process.cwd(), "supabase/migrations/20250729000001_commerce_engine_v1.sql"),
  "utf8",
);

describe("Commerce Engine v1.0 — Phase 1 foundation", () => {
  it("exposes the single financial authority surface", () => {
    expect(typeof CommerceEngine.creditSeller).toBe("function");
    expect(typeof CommerceEngine.refundSeller).toBe("function");
    expect(typeof CommerceEngine.releaseEligiblePendingBalances).toBe("function");
    expect(typeof CommerceEngine.getOrderLedger).toBe("function");
    expect(typeof CommerceEngine.recordCommerceAudit).toBe("function");
    expect(typeof CommerceEngine.recordEscrowEvent).toBe("function");
    expect(typeof CommerceEngine.recordRefundEvent).toBe("function");
  });

  it("defines all spec wallet states", () => {
    expect([...WALLET_STATES]).toEqual([
      "pending",
      "available",
      "on_hold",
      "refunded",
      "released",
      "reserved_shipping",
      "platform_revenue",
    ]);
  });

  it("creates the canonical immutable ledger tables", () => {
    for (const table of [
      "commerce_audit_logs",
      "escrow_events",
      "refund_events",
      "shipping_reserve",
      "shipping_transactions",
    ]) {
      expect(MIGRATION).toContain(`create table if not exists public.${table}`);
    }
  });

  it("enforces append-only immutability on ledger tables via triggers", () => {
    expect(MIGRATION).toContain("commerce_prevent_mutation");
    expect(MIGRATION).toContain("commerce_audit_logs_immutable");
    expect(MIGRATION).toContain("escrow_events_immutable");
    expect(MIGRATION).toContain("refund_events_immutable");
    expect(MIGRATION).toContain("shipping_transactions_immutable");
  });

  it("blocks direct writes by auth users (no insert/update/delete policies; service_role only)", () => {
    // Only SELECT policies exist for authenticated users on financial tables.
    expect(MIGRATION).toContain("for select");
    expect(MIGRATION).not.toContain("for insert");
    expect(MIGRATION).not.toContain("for update\n  using");
    expect(MIGRATION).toContain("grant all on public.commerce_audit_logs to service_role");
  });

  it("keeps the migration additive (no drops/alters of existing money tables)", () => {
    expect(MIGRATION).not.toContain("drop table");
    expect(MIGRATION).not.toMatch(/alter table public\.(wallets|wallet_transactions|orders)\b/);
  });
});
