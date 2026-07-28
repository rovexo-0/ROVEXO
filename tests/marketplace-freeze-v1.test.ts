import { describe, expect, it } from "vitest";
import {
  assertMarketplaceFreezeOrBlock,
  MARKETPLACE_FREEZE_V1,
} from "@/lib/marketplace-freeze-v1";

describe("Marketplace Freeze v1.0", () => {
  it("is Owner certified frozen baseline", () => {
    expect(MARKETPLACE_FREEZE_V1.approvedByOwner).toBe(true);
    expect(MARKETPLACE_FREEZE_V1.certified).toBe(true);
    expect(MARKETPLACE_FREEZE_V1.frozen).toBe(true);
    expect(MARKETPLACE_FREEZE_V1.locked).toBe(true);
    expect(MARKETPLACE_FREEZE_V1.canonicalProductionBaseline).toBe(true);
    expect(MARKETPLACE_FREEZE_V1.status).toBe("CERTIFIED_FROZEN_APPROVED");
  });

  it("records all certification gates as PASS", () => {
    for (const value of Object.values(MARKETPLACE_FREEZE_V1.certificationGates)) {
      expect(value).toBe("PASS");
    }
  });

  it("enforces singularity and role isolation", () => {
    expect(MARKETPLACE_FREEZE_V1.singularity.oneSsotPerModule).toBe(true);
    expect(MARKETPLACE_FREEZE_V1.singularity.noParallelSystems).toBe(true);
    expect(
      MARKETPLACE_FREEZE_V1.roleSeparation
        .messagesNeverRendersWalletWithdrawBalanceOrFinancialSummaries,
    ).toBe(true);
    expect(
      MARKETPLACE_FREEZE_V1.roleSeparation.walletIsOnlyFinancialDestination,
    ).toBe(true);
  });

  it("fail-closed assert passes", () => {
    expect(() => assertMarketplaceFreezeOrBlock()).not.toThrow();
  });
});
