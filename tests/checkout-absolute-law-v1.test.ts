import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { CHECKOUT_ABSOLUTE_LAW_V1 } from "@/lib/checkout/checkout-absolute-law-v1";

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("checkout absolute law v1.0 — DONE readiness FINAL LOCK", () => {
  it("locks Owner FINAL LOCK + DONE gates", () => {
    expect(CHECKOUT_ABSOLUTE_LAW_V1.status).toBe("FINAL_LOCK");
    expect(CHECKOUT_ABSOLUTE_LAW_V1.ownerLocked).toBe(true);
    expect(CHECKOUT_ABSOLUTE_LAW_V1.doneLaw.requiredGates).toEqual([
      "PAYMENT_CAPTURED",
      "ORDER_CREATED",
      "TRANSACTION_CREATED",
      "TRANSACTION_CONVERSATION_CREATED",
      "SYSTEM_MESSAGES_CREATED",
      "PAYMENT_LIFECYCLE_CREATED",
    ]);
    expect(CHECKOUT_ABSOLUTE_LAW_V1.doneLaw.failFallback).toBeNull();
  });

  it("DONE exists only when doneReady — no Inbox / retry / Loading copy", () => {
    const view = readSource("features/checkout/components/CheckoutSuccessView.tsx");
    expect(view).toContain("doneReady");
    expect(view).toContain("/inbox/conversation/");
    expect(view).toContain("/api/checkout/done-ready");
    expect(view).toContain("AUTO_OPEN");
    expect(view).toContain('data-inbox-fallback="forbidden"');
    expect(view).not.toMatch(/Please try again/);
    expect(view).not.toMatch(/Opening…/);
    expect(view).not.toMatch(/["'`]Loading/);
    expect(view).not.toMatch(/Conversation not found/);
    expect(view).not.toMatch(/router\.replace\(["'`]\/inbox["'`]\)/);
    expect(view).not.toMatch(/Continue Shopping/);
    expect(view).not.toMatch(/View Order/);
  });

  it("done readiness gate + API exist", () => {
    const gate = readSource("lib/checkout/done-readiness-gate-v1.ts");
    const api = readSource("app/api/checkout/done-ready/route.ts");
    expect(gate).toContain("evaluateDoneReadinessGate");
    expect(gate).toContain("systemMessagesCreated");
    expect(gate).toContain("paymentCaptured");
    expect(api).toContain("evaluateDoneReadinessGate");
  });

  it("success route wires DONE gate", () => {
    const route = readSource("app/checkout/[slug]/success/page.tsx");
    expect(route).toContain("evaluateDoneReadinessGate");
    expect(route).toContain("doneReady={gate.allPass}");
    expect(route).not.toContain('redirect("/inbox")');
  });
});
