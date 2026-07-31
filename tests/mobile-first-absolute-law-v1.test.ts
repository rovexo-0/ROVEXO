import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertMobileCertificationOrBlock,
  MOBILE_FIRST_ABSOLUTE_LAW_V1,
  resolveMobileFirstCertificationResult,
} from "@/lib/mobile-first/mobile-first-absolute-law-v1";

describe("Mobile First Absolute Law v1.0", () => {
  it("locks Owner permanent Mobile First contract", () => {
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.approvedByOwner).toBe(true);
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.permanent).toBe(true);
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.noExceptions).toBe(true);
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.referencePlatform).toBe("MOBILE");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.desktopPriority).toBe("SECONDARY");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.primaryReference).toBe("iPhone Safari");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.platformPriority[0]).toBe("iPhone Safari");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.failPolicy.desktopPassMobileFail).toBe("FAIL");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.everyNewModuleMustVerify).toContain("visualViewport");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.everyNewModuleMustVerify).toContain("HEIC");
    expect(MOBILE_FIRST_ABSOLUTE_LAW_V1.mobileCertificationMandatory).toContain("iPhone Safari");
  });

  it("fails when Mobile fails even if Desktop passes", () => {
    expect(
      resolveMobileFirstCertificationResult({ desktopPass: true, mobilePass: false }),
    ).toBe("FAIL");
    expect(
      resolveMobileFirstCertificationResult({ desktopPass: true, mobilePass: true }),
    ).toBe("PASS");
  });

  it("blocks PASS/FREEZE without Mobile Certification", () => {
    expect(() =>
      assertMobileCertificationOrBlock({ mobileCertificationPass: false }),
    ).toThrow(/MOBILE FIRST LAW/);
    expect(() =>
      assertMobileCertificationOrBlock({ mobileCertificationPass: true }),
    ).not.toThrow();
  });

  it("ships always-on Cursor rule aligned to SSOT", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/mobile-first-absolute-law-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("lib/mobile-first/mobile-first-absolute-law-v1.ts");
    expect(rule).toContain("Desktop PASS + Mobile FAIL = FAIL");
    expect(rule).toContain("iPhone Safari");
  });
});
