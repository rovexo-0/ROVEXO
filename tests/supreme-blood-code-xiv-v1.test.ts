import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XIV_V1,
  isBloodXivWalletRouteAllowed,
  isBloodXivForbiddenEntryPoint,
  isSprintVSellForbidden,
  resolveBloodXivPermanentFreeze,
  resolveBloodXivScopePolicy,
} from "@/lib/supreme-blood-code-xiv-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XIII_V1 } from "@/lib/supreme-blood-code-xiii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XIV — Wallet Development Freeze Law", () => {
  it("locks Blood XIV Wallet Development Freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_XIV_V1.codename).toBe(
      "SPRINT_IV_WALLET_DEVELOPMENT_FREEZE_LAW",
    );
    expect(SUPREME_BLOOD_CODE_XIV_V1.status).toBe("APPROVED_TO_START");
    expect(SUPREME_BLOOD_CODE_XIV_V1.bloodCodeLocked).toBe(true);
    expect(SUPREME_BLOOD_CODE_XIV_V1.developmentStatus).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIV_V1.officialRoute).toBe("/wallet");
    expect(SUPREME_BLOOD_CODE_XIV_V1.officialLocalhost).toBe(
      "http://localhost:3000/wallet",
    );
    expect(SUPREME_BLOOD_CODE_XIV_V1.lockedModules.I.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIV_V1.lockedModules.II.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIV_V1.lockedModules.III.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIV_V1.nextSprint.status).toBe(
      "OWNER_APPROVED_VIA_BLOOD_XVIII_IN_DEVELOPMENT",
    );
    expect(WALLET_ROUTES.hub).toBe("/wallet");
    expect(isSprintVSellForbidden()).toBe(false);
  });

  it("allows /wallet only and forbids alternate entry points", () => {
    expect(isBloodXivWalletRouteAllowed("/wallet")).toBe(true);
    expect(isBloodXivWalletRouteAllowed("/wallet/withdraw")).toBe(true);
    expect(isBloodXivWalletRouteAllowed("/orders")).toBe(false);
    expect(isBloodXivForbiddenEntryPoint("/balance")).toBe(true);
    expect(isBloodXivForbiddenEntryPoint("/wallet-v2")).toBe(true);
    expect(isBloodXivForbiddenEntryPoint("/wallet-new")).toBe(true);
    expect(isBloodXivForbiddenEntryPoint("/wallet-redesign")).toBe(true);
    expect(isBloodXivForbiddenEntryPoint("/wallet-beta")).toBe(true);
    expect(isBloodXivForbiddenEntryPoint("/wallet-test")).toBe(true);
    expect(isBloodXivForbiddenEntryPoint("/wallet")).toBe(false);
    expect(resolveBloodXivScopePolicy("/wallet").allowed).toBe(true);
    expect(resolveBloodXivScopePolicy("/inbox").allowed).toBe(false);
  });

  it("permanent freeze only when all Owner conditions pass", () => {
    expect(
      resolveBloodXivPermanentFreeze({
        walletFunctionalityComplete: true,
        visualCertificationComplete: true,
        mobileCertificationComplete: true,
        responsiveCertificationComplete: true,
        ownerApprovalComplete: true,
        productionQaComplete: true,
      }),
    ).toBe("PERMANENT_FREEZE");
    expect(
      resolveBloodXivPermanentFreeze({
        walletFunctionalityComplete: true,
        visualCertificationComplete: true,
        mobileCertificationComplete: true,
        responsiveCertificationComplete: true,
        ownerApprovalComplete: false,
        productionQaComplete: true,
      }),
    ).toBe("NOT_READY");
  });

  it("keeps Search Bar Homepage-only and stamps Wallet hub with Blood XIV", () => {
    expect(isHomepageSearchBarRoute("/")).toBe(true);
    expect(isHomepageSearchBarRoute("/wallet")).toBe(false);
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const route = readSource("app/wallet/page.tsx");
    const config = readSource("next.config.ts");
    expect(hub).toContain("data-blood-code-xiv");
    expect(hub).toContain("data-blood-code-xiii");
    expect(hub).toContain("showBottomNav");
    expect(route).toContain("WalletPage");
    expect(config).toContain('source: "/balance", destination: "/wallet"');
    expect(SUPREME_BLOOD_CODE_XIII_V1.officialRoute).toBe("/wallet");
  });

  it("wires into Blood I/XIII, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintIvWalletDevelopmentFreezeLaw: "lib/supreme-blood-code-xiv-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXiv: "lib/supreme-blood-code-xiv-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXiv: "lib/supreme-blood-code-xiv-v1.ts",
    });
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xiv-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XIV_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("WALLET ONLY");
    expect(doc).toContain("Development Freeze Law");
    expect(doc).toContain("http://localhost:3000/wallet");
  });
});
