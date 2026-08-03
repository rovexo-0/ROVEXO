import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHECKOUT_CERTIFICATION_RC1_V1,
  isCheckoutPassFreeze,
} from "@/lib/checkout/checkout-certification-rc1-v1";
import { SUPREME_BLOOD_CODE_XXIII_V1 } from "@/lib/supreme-blood-code-xxiii-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("RC1 Checkout Certification Blood XXIII", () => {
  it("records Owner PASS+FREEZE after Owner visual certification", () => {
    expect(CHECKOUT_CERTIFICATION_RC1_V1.status).toBe("PASS+FREEZE");
    expect(CHECKOUT_CERTIFICATION_RC1_V1.verdict).toBe("PASS+FREEZE");
    expect(CHECKOUT_CERTIFICATION_RC1_V1.masterGate).toBe("PASS+FREEZE");
    expect(isCheckoutPassFreeze()).toBe(true);
    expect(CHECKOUT_CERTIFICATION_RC1_V1.ownerCertified).toBe(true);
    expect(CHECKOUT_CERTIFICATION_RC1_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.ownerCertified).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXIII_V1.complete100).toBe(true);
  });

  it("records phase gates and CKT fixes", () => {
    expect(CHECKOUT_CERTIFICATION_RC1_V1.phases.architecture.gate).toBe("PASS");
    expect(CHECKOUT_CERTIFICATION_RC1_V1.phases.security.gate).toBe("PASS");
    expect(CHECKOUT_CERTIFICATION_RC1_V1.phases.engineering.gate).toBe("PASS");
    expect(CHECKOUT_CERTIFICATION_RC1_V1.defectsFound.map((d) => d.id)).toEqual(
      expect.arrayContaining(["CKT-001", "CKT-002"]),
    );
    expect(CHECKOUT_CERTIFICATION_RC1_V1.remainingBlockers.length).toBe(0);
    expect(CHECKOUT_CERTIFICATION_RC1_V1.blockers.blocker1OwnerFlags.artificialPassForbidden).toBe(
      true,
    );
    expect(CHECKOUT_CERTIFICATION_RC1_V1.blockers.blocker1OwnerFlags.status).toBe(
      "OWNER_PASS_CLOSED",
    );
  });

  it("ships certification report and Guard16 fail-closed bindings", () => {
    const report = "docs/releases/rc1/CHECKOUT_CERTIFICATION_BLOOD_XXIII.md";
    expect(existsSync(join(process.cwd(), report))).toBe(true);
    expect(readSource(report)).toContain("PASS+FREEZE");
    expect(readSource(report)).toContain("CKT-002");
    expect(readSource(report)).toContain("OWNER_PASS");
    const engine = readSource("lib/checkout/engines/buy-now-engine-v1.ts");
    expect(engine).toContain("orderID: Boolean(sessionResult.session.public_id)");
    expect(engine).not.toMatch(/orderID:\s*true/);
    expect(readSource("features/checkout/hooks/use-checkout-form.ts")).toContain(
      "submittingLockRef",
    );
  });
});
