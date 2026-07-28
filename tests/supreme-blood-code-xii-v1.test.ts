import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XII_V1,
  isOrdersModuleFrozen,
  isOrdersRoute,
  resolveBloodXiiPostFreezePolicy,
} from "@/lib/supreme-blood-code-xii-v1";
import { SUPREME_BLOOD_CODE_XI_V1 } from "@/lib/supreme-blood-code-xi-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XII — Sprint III Orders Permanent Freeze", () => {
  it("locks Orders 100% complete permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_XII_V1.codename).toBe("SPRINT_III_ORDERS_PERMANENT_FREEZE");
    expect(SUPREME_BLOOD_CODE_XII_V1.status).toBe("APPROVED");
    expect(SUPREME_BLOOD_CODE_XII_V1.completion).toBe("100_COMPLETE");
    expect(SUPREME_BLOOD_CODE_XII_V1.permanentFreeze).toBe(true);
    expect(SUPREME_BLOOD_CODE_XII_V1.officialRoute).toBe("/orders");
    expect(SUPREME_BLOOD_CODE_XII_V1.officialLocalhost).toBe("http://localhost:3000/orders");
    expect(isOrdersModuleFrozen()).toBe(true);
    expect(SUPREME_BLOOD_CODE_XII_V1.sprintStatus.III.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XII_V1.sprintStatus.IV.status).toBe("LOCKED");
  });

  it("scopes Orders routes and financial absolute law", () => {
    expect(isOrdersRoute("/orders")).toBe(true);
    expect(isOrdersRoute("/orders/abc")).toBe(true);
    expect(isOrdersRoute("/orders/abc/tracking")).toBe(true);
    expect(isOrdersRoute("/inbox")).toBe(false);
    expect(isOrdersRoute("/wallet")).toBe(false);
    expect(SUPREME_BLOOD_CODE_XII_V1.financial.absoluteLaw.buyerMustNeverSee).toBe(
      "YOU'LL RECEIVE",
    );
    expect(SUPREME_BLOOD_CODE_XII_V1.financial.absoluteLaw.sellerMustNeverSee).toBe(
      "TOTAL PAID",
    );
  });

  it("blocks post-freeze redesigns without Owner/critical path", () => {
    expect(resolveBloodXiiPostFreezePolicy("redesign").allowed).toBe(false);
    expect(resolveBloodXiiPostFreezePolicy("new component").allowed).toBe(false);
    expect(resolveBloodXiiPostFreezePolicy("critical bug fix").allowed).toBe(true);
    expect(resolveBloodXiiPostFreezePolicy("owner approval").allowed).toBe(true);
  });

  it("keeps Search Bar Homepage-only and Orders header Back+Orders", () => {
    expect(isHomepageSearchBarRoute("/")).toBe(true);
    expect(isHomepageSearchBarRoute("/orders")).toBe(false);
    const page = readSource("features/orders/components/OrdersPage.tsx");
    expect(page).toContain('title="Orders"');
    expect(page).toContain("showBottomNav");
    expect(page).toContain("data-blood-code-xii");
    expect(page).not.toContain("RovexoHeaderV2");
    expect(page).not.toContain("HomepageSearchField");
  });

  it("wires into Blood I/XI, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintIiiOrdersPermanentFreeze: "lib/supreme-blood-code-xii-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.III.status).toBe("LOCKED");
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXii: "lib/supreme-blood-code-xii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXii: "lib/supreme-blood-code-xii-v1.ts",
    });
  });

  it("persists rule, doc, and Master UI LOCKED status", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XII_V1.md");
    const masterUi = readSource("docs/modules/orders/MASTER_UI_SPECIFICATION.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("PERMANENT FREEZE");
    expect(doc).toContain("Sprint III Orders Permanent Freeze");
    expect(masterUi).toContain("**STATUS:** LOCKED");
    expect(masterUi).toContain("http://localhost:3000/orders");
  });
});
