import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertProfileAbsoluteMasterAligned,
  PROFILE_ABSOLUTE_MASTER_CONTRACT,
  PROFILE_ABSOLUTE_MASTER_FORBIDDEN,
  PROFILE_ABSOLUTE_MASTER_GOLDEN_RULE,
  PROFILE_ABSOLUTE_MASTER_MODULES,
  PROFILE_ABSOLUTE_MASTER_STATUS,
  PROFILE_ABSOLUTE_MASTER_TOKENS,
  profileAbsoluteMasterSnapshot,
} from "@/lib/design-system/profile-absolute-master-v7";
import {
  PROFILE_IS_PLATFORM_MASTER_DESIGN_SYSTEM,
  PROFILE_MASTER_DESIGN_RULES,
  PROFILE_MASTER_DESIGN_VERSION,
  PROFILE_MASTER_PLATFORM_CONTRACT,
} from "@/lib/design-system/profile-master-design-lock";
import { MASTER_FULL_WIDTH_GOLDEN_RULE, MASTER_FULL_WIDTH_SURFACES } from "@/lib/master-engine/master-full-width-contract-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Profile Absolute Master Design System — Contract v7.0", () => {
  it("locks Profile as absolute platform master", () => {
    expect(PROFILE_ABSOLUTE_MASTER_CONTRACT).toBe("v7.0");
    expect(PROFILE_ABSOLUTE_MASTER_STATUS).toBe("PERMANENTLY LOCKED");
    expect(PROFILE_MASTER_PLATFORM_CONTRACT).toBe("v7.0");
    expect(PROFILE_MASTER_DESIGN_VERSION).toBe("7.0");
    expect(PROFILE_IS_PLATFORM_MASTER_DESIGN_SYSTEM).toBe(true);
    expect(PROFILE_MASTER_DESIGN_RULES.platformMasterDesignSystem).toBe(true);
    expect(PROFILE_MASTER_DESIGN_RULES.onlyContentMayDiffer).toBe(true);
    expect(PROFILE_MASTER_DESIGN_RULES.designNeverDiffers).toBe(true);
    expect(PROFILE_ABSOLUTE_MASTER_GOLDEN_RULE).toContain("ONLY CONTENT MAY CHANGE");
    expect(MASTER_FULL_WIDTH_GOLDEN_RULE).toContain("ABSOLUTE MASTER");
    expect(assertProfileAbsoluteMasterAligned()).toBe(true);
  });

  it("requires every Owner module to inherit Profile", () => {
    for (const mod of [
      "wallet",
      "orders",
      "checkout",
      "shipping",
      "messages-hub",
      "notifications",
      "admin",
      "super-admin",
      "demo",
    ] as const) {
      expect(PROFILE_ABSOLUTE_MASTER_MODULES).toContain(mod);
      expect(MASTER_FULL_WIDTH_SURFACES).toContain(mod === "messages-hub" ? "messages-hub" : mod);
    }
  });

  it("forbids constrained / fake / duplicate design patterns", () => {
    expect(PROFILE_ABSOLUTE_MASTER_FORBIDDEN).toContain("max-width 1200px");
    expect(PROFILE_ABSOLUTE_MASTER_FORBIDDEN).toContain("giant cards");
    expect(PROFILE_ABSOLUTE_MASTER_FORBIDDEN).toContain("fake integrations");
    expect(PROFILE_ABSOLUTE_MASTER_TOKENS.maxWidth).toBe("none");
    expect(PROFILE_ABSOLUTE_MASTER_TOKENS.headerPx).toBe(64);
    expect(PROFILE_ABSOLUTE_MASTER_TOKENS.buttonHeightPx).toBe(56);
    expect(PROFILE_ABSOLUTE_MASTER_TOKENS.buttonRadiusPx).toBe(16);
    expect(PROFILE_ABSOLUTE_MASTER_TOKENS.paddingPx).toBe(16);
  });

  it("Wallet hub + transactions inherit Profile shell (no decorative cards)", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const tx = readSource("features/wallet/components/WalletTransactionsList.tsx");
    expect(hub).toContain("AccountCanonicalShell");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).toContain('className="wallet-v2"');
    expect(tx).toContain("AccountCanonicalShell");
    expect(tx).toContain('data-wallet-transactions-version="v3.0-profile-master"');
    expect(tx).not.toContain("CanonicalCard");
    expect(tx).toContain("min-h-[56px]");
    expect(tx).toContain("rounded-[16px]");
  });

  it("snapshot is fail-closed aligned", () => {
    const snap = profileAbsoluteMasterSnapshot();
    expect(snap.aligned).toBe(true);
    expect(snap.reference).toBe("PROFILE");
  });
});
