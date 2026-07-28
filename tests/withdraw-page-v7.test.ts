import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  WITHDRAW_HUB_BUTTON_RULE,
  WITHDRAW_PAGE_DOM,
  WITHDRAW_PAGE_FREEZE,
  WITHDRAW_PAGE_VERSION,
  WITHDRAW_SOFT_COPY,
  buildWithdrawPageView,
  createEmptyWalletData,
  isWithdrawAmountOverMax,
  resolveWithdrawPageState,
} from "@/lib/wallet/withdraw-page-v7";
import type { WalletData } from "@/lib/wallet/types";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function mockWallet(partial: Partial<WalletData> = {}): WalletData {
  return { ...createEmptyWalletData(), ...partial };
}

describe("Withdraw Page v7.0 FINAL FROZEN — Absolute Authority", () => {
  it("locks freeze markers + always-open hub", () => {
    expect(WITHDRAW_HUB_BUTTON_RULE).toBe("ALWAYS_OPEN");
    expect(WITHDRAW_PAGE_VERSION).toBe("v7.1");
    expect(WITHDRAW_PAGE_DOM).toBe("v7.1-final-frozen");
    expect(WITHDRAW_PAGE_FREEZE).toBe("FROZEN");
  });

  it("maps soft fails → empty · funded → functional · success", () => {
    expect(resolveWithdrawPageState(mockWallet(), { loading: true })).toBe("loading");
    expect(resolveWithdrawPageState(mockWallet({ availableBalance: 0 }))).toBe("empty");
    expect(resolveWithdrawPageState(mockWallet({ availableBalance: 145.5 }))).toBe("functional");
    expect(
      resolveWithdrawPageState(mockWallet({ availableBalance: 100 }), { softFail: "stripe" }),
    ).toBe("empty");
    expect(
      resolveWithdrawPageState(mockWallet({ availableBalance: 100 }), { softFail: "api" }),
    ).toBe("empty");
    expect(
      resolveWithdrawPageState(mockWallet({ availableBalance: 100 }), { success: true }),
    ).toBe("success");
  });

  it("uses only Owner soft copy — never Withdrawals unavailable", () => {
    const empty = buildWithdrawPageView(mockWallet({ availableBalance: 0 }));
    const soft = buildWithdrawPageView(mockWallet({ availableBalance: 50 }), {
      softFail: "network",
    });
    expect(empty.softMessage).toBe("No funds available.");
    expect(soft.state).toBe("empty");
    expect(soft.available).toBe(0);
    expect(soft.softMessage).toBe("No funds available.");
    expect(WITHDRAW_SOFT_COPY.amountLabel).toBe("Amount:");
    expect(WITHDRAW_SOFT_COPY.overMax).toBe("Maximum available amount exceeded.");
    expect(isWithdrawAmountOverMax("200", 145.5)).toBe(true);
    expect(isWithdrawAmountOverMax("145.50", 145.5)).toBe(false);

    const page = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const ssot = readSource("lib/wallet/withdraw-page-v7.ts");
    expect(page).not.toContain("Something went wrong");
    expect(page).not.toContain("FailClosedPanel");
    expect(ssot).not.toContain('unavailable: "');
    expect(Object.values(WITHDRAW_SOFT_COPY)).not.toContain("Withdrawals unavailable.");
  });

  it("ships frozen UI contract surfaces", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const page = readSource("features/wallet/components/withdraw/WithdrawPage.tsx");
    const css = readSource("styles/rovexo/withdraw-v7.css");
    expect(hub).toContain("WALLET_ROUTES.withdraw");
    expect(hub).toContain("Available to withdraw");
    expect(page).toContain('data-withdraw-freeze={WITHDRAW_PAGE_FREEZE}');
    expect(page).toContain("Available Balance");
    expect(page).toContain("Withdrawal amount");
    expect(page).toContain("Withdraw all");
    expect(page).toContain("You will receive");
    expect(page).toContain("Amount:");
    expect(css).toContain("opacity: 0.5");
    expect(css).toContain("pointer-events: none");
    expect(css).toContain("content: none !important");
  });
});
