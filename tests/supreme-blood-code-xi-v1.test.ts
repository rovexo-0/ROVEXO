import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XI_V1,
  isSprintIiiRouteAllowed,
  isSprintIiiSurfaceForbidden,
  resolveBloodXiBugPolicy,
} from "@/lib/supreme-blood-code-xi-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { isHomepageSearchBarRoute } from "@/lib/header/homepage-search-bar-only-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XI — Development Freeze Law", () => {
  it("locks permanent Development Freeze Law markers", () => {
    expect(SUPREME_BLOOD_CODE_XI_V1.codename).toBe("DEVELOPMENT_FREEZE_LAW");
    expect(SUPREME_BLOOD_CODE_XI_V1.status).toBe("APPROVED");
    expect(SUPREME_BLOOD_CODE_XI_V1.permanent).toBe(true);
    expect(SUPREME_BLOOD_CODE_XI_V1.officialLocalhost).toBe("http://localhost:3000");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.I.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.II.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.III.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.III.completion).toBe("100_COMPLETE");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.IV.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.V.status).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XI_V1.sprints.VI.status).toBe("IN_DEVELOPMENT");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentSprint).toBe("VI");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentModule).toBe("CHECKOUT");
    expect(SUPREME_BLOOD_CODE_XI_V1.currentAllowedRoute).toBe("/checkout");
  });

  it("allows Sprint III only on /orders", () => {
    expect(isSprintIiiRouteAllowed("/orders")).toBe(true);
    expect(isSprintIiiRouteAllowed("/orders/abc")).toBe(true);
    expect(isSprintIiiRouteAllowed("/orders/abc/tracking")).toBe(true);
    expect(isSprintIiiRouteAllowed("/inbox")).toBe(false);
    expect(isSprintIiiRouteAllowed("/inbox?tab=notifications")).toBe(false);
    expect(isSprintIiiRouteAllowed("/")).toBe(false);
    expect(isSprintIiiRouteAllowed("/wallet")).toBe(false);
    expect(isSprintIiiRouteAllowed("/account")).toBe(false);
    expect(isSprintIiiRouteAllowed("/sell")).toBe(false);
    expect(isSprintIiiRouteAllowed("/checkout")).toBe(false);
  });

  it("forbids Sprint III surfaces outside Orders", () => {
    expect(isSprintIiiSurfaceForbidden("Inbox")).toBe(true);
    expect(isSprintIiiSurfaceForbidden("Homepage")).toBe(true);
    expect(isSprintIiiSurfaceForbidden("Conversation")).toBe(true);
    expect(isSprintIiiSurfaceForbidden("Wallet")).toBe(true);
    expect(isSprintIiiSurfaceForbidden("Orders")).toBe(false);
  });

  it("bug outside /orders → STOP REPORT DO NOT FIX WAIT", () => {
    expect(resolveBloodXiBugPolicy("/orders/1").allowed).toBe(true);
    expect(resolveBloodXiBugPolicy("/inbox").allowed).toBe(false);
    expect(resolveBloodXiBugPolicy("/inbox").policy).toEqual([
      "STOP",
      "REPORT",
      "DO_NOT_FIX",
      "WAIT_FOR_OWNER_APPROVAL",
    ]);
  });

  it("keeps Search Bar law Homepage-only unmounted elsewhere", () => {
    expect(SUPREME_BLOOD_CODE_XI_V1.searchBarLaw.allowedOnlyOn).toBe("/");
    expect(SUPREME_BLOOD_CODE_XI_V1.searchBarLaw.mustBe).toBe("UNMOUNTED");
    expect(isHomepageSearchBarRoute("/")).toBe(true);
    expect(isHomepageSearchBarRoute("/orders")).toBe(false);
    expect(isHomepageSearchBarRoute("/inbox")).toBe(false);
  });

  it("wires into Blood I, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      developmentFreezeLaw: "lib/supreme-blood-code-xi-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXi: "lib/supreme-blood-code-xi-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXi: "lib/supreme-blood-code-xi-v1.ts",
    });
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xi-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XI_V1.md");
    const code = readSource("lib/supreme-blood-code-xi-v1.ts");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("ONE SPRINT = ONE MODULE");
    expect(doc).toContain("Development Freeze Law");
    expect(code).toContain("DEVELOPMENT_FREEZE_LAW");
  });
});
