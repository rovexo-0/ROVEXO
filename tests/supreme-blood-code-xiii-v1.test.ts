import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XIII_V1,
  isSprintIvRouteAllowed,
  isSprintIvHubRoute,
  isSprintIvSurfaceForbidden,
  resolveBloodXiiiScopePolicy,
} from "@/lib/supreme-blood-code-xiii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XI_V1 } from "@/lib/supreme-blood-code-xi-v1";
import { SUPREME_BLOOD_CODE_XII_V1 } from "@/lib/supreme-blood-code-xii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XIII — Sprint IV Wallet", () => {
  it("locks Approved-to-Start markers and /wallet official route", () => {
    expect(SUPREME_BLOOD_CODE_XIII_V1.codename).toBe("SPRINT_IV_WALLET_APPROVED_TO_START");
    expect(SUPREME_BLOOD_CODE_XIII_V1.status).toBe("APPROVED_TO_START");
    expect(SUPREME_BLOOD_CODE_XIII_V1.developmentStatus).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIII_V1.officialRoute).toBe("/wallet");
    expect(SUPREME_BLOOD_CODE_XIII_V1.officialLocalhost).toBe("http://localhost:3000/wallet");
    expect(SUPREME_BLOOD_CODE_XIII_V1.lockedModules.I.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIII_V1.lockedModules.II.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIII_V1.lockedModules.III.status).toBe("LOCKED");
    expect(WALLET_ROUTES.hub).toBe("/wallet");
  });

  it("allows Sprint IV only on /wallet tree", () => {
    expect(isSprintIvHubRoute("/wallet")).toBe(true);
    expect(isSprintIvHubRoute("/wallet/transactions")).toBe(false);
    expect(isSprintIvRouteAllowed("/wallet")).toBe(true);
    expect(isSprintIvRouteAllowed("/wallet/withdraw")).toBe(true);
    expect(isSprintIvRouteAllowed("/wallet/transactions")).toBe(true);
    expect(isSprintIvRouteAllowed("/orders")).toBe(false);
    expect(isSprintIvRouteAllowed("/inbox")).toBe(false);
    expect(isSprintIvRouteAllowed("/")).toBe(false);
    expect(isSprintIvRouteAllowed("/account")).toBe(false);
  });

  it("forbids locked / out-of-scope surfaces", () => {
    expect(isSprintIvSurfaceForbidden("Orders")).toBe(true);
    expect(isSprintIvSurfaceForbidden("Inbox")).toBe(true);
    expect(isSprintIvSurfaceForbidden("Homepage")).toBe(true);
    expect(isSprintIvSurfaceForbidden("Payment Methods")).toBe(true);
    expect(isSprintIvSurfaceForbidden("Profile")).toBe(true);
    expect(resolveBloodXiiiScopePolicy("/wallet").allowed).toBe(true);
    expect(resolveBloodXiiiScopePolicy("/orders").allowed).toBe(false);
  });

  it("keeps Search Bar Homepage-only and stamps Wallet hub", () => {
    expect(isHomepageSearchBarRoute("/")).toBe(true);
    expect(isHomepageSearchBarRoute("/wallet")).toBe(false);
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const route = readSource("app/(platform)/wallet/page.tsx");
    expect(hub).toContain("data-blood-code-xiii");
    expect(hub).toContain("showBottomNav");
    expect(hub).toContain("BALANCE_PAGE_NAME");
    expect(hub).not.toContain("RovexoHeaderV2");
    expect(route).toContain("WalletPage");
    expect(route).not.toContain('redirect(`/balance');
  });

  it("wires into Blood I/XI/XII, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintIvWalletApprovedToStart: "lib/supreme-blood-code-xiii-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.IV.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XII_V1.sprintStatus.IV.status).toBe("LOCKED");
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXiii: "lib/supreme-blood-code-xiii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXiii: "lib/supreme-blood-code-xiii-v1.ts",
    });
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xiii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XIII_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("APPROVED TO START");
    expect(doc).toContain("Sprint IV Wallet");
    expect(doc).toContain("http://localhost:3000/wallet");
  });
});
