import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ABSOLUTE_FINANCIAL_LAW_V1,
  SUPREME_BLOOD_CODE_XXIV_V1,
  getAbsoluteFinancialErrorMessage,
  isForbiddenGenericFinancialError,
  resolveCheckoutGuardGate,
  resolveFinancialChainIntegrity,
  resolveAbsoluteFinancialProductionPass,
  isDuplicateFinancialOutcomeForbidden,
} from "@/lib/supreme-blood-code-xxiv-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XXIII_V1 } from "@/lib/supreme-blood-code-xxiii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function allGuardPass(): Record<
  (typeof ABSOLUTE_FINANCIAL_LAW_V1.checkoutGuardMustVerifyPass)[number],
  boolean
> {
  return Object.fromEntries(
    ABSOLUTE_FINANCIAL_LAW_V1.checkoutGuardMustVerifyPass.map((key) => [key, true]),
  ) as Record<(typeof ABSOLUTE_FINANCIAL_LAW_V1.checkoutGuardMustVerifyPass)[number], boolean>;
}

describe("ROVEXO Absolute Financial Law v1.0 / Blood XXIV", () => {
  it("locks permanent financial freeze markers", () => {
    expect(ABSOLUTE_FINANCIAL_LAW_V1.codename).toBe("ABSOLUTE_FINANCIAL_LAW_FREEZE");
    expect(ABSOLUTE_FINANCIAL_LAW_V1.bloodCode).toBe("XXIV");
    expect(SUPREME_BLOOD_CODE_XXIV_V1).toBe(ABSOLUTE_FINANCIAL_LAW_V1);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.freezeLocked).toBe(true);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.noPassWithoutPaymentFlowPass).toBe(true);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.financialEquation).toEqual({
      oneClick: 1,
      onePayment: 1,
      oneOrder: 1,
      oneTransaction: 1,
      oneEscrow: 1,
      oneCompletion: 1,
    });
    expect(ABSOLUTE_FINANCIAL_LAW_V1.productionLaw.passEquals).toBe(100);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.checkoutGuardMustVerifyPass).toHaveLength(11);
  });

  it("Checkout Guard fail-closed stops everything", () => {
    const pass = allGuardPass();
    expect(resolveCheckoutGuardGate(pass)).toBe("FINANCIAL_AUDITOR_PASS");
    expect(resolveCheckoutGuardGate({ ...pass, price: false })).toBe("STOP_EVERYTHING");
    expect(resolveCheckoutGuardGate({ ...pass, paymentSession: false })).toBe(
      "STOP_EVERYTHING",
    );
  });

  it("chain integrity STOP on any inequality", () => {
    expect(
      resolveFinancialChainIntegrity({
        priceEqualsPayment: true,
        paymentEqualsOrder: true,
        orderEqualsTransaction: true,
        transactionEqualsEscrow: true,
        escrowEqualsCompletion: true,
      }),
    ).toBe("CHAIN_PASS");
    expect(
      resolveFinancialChainIntegrity({
        priceEqualsPayment: true,
        paymentEqualsOrder: false,
        orderEqualsTransaction: true,
        transactionEqualsEscrow: true,
        escrowEqualsCompletion: true,
      }),
    ).toBe("STOP");
  });

  it("forbids generic errors; exposes RVX-2001…2012 (Root Cause Detection)", () => {
    expect(isForbiddenGenericFinancialError("Something went wrong.")).toBe(true);
    expect(getAbsoluteFinancialErrorMessage("RVX-2001")).toBe("This item is no longer available.");
    expect(getAbsoluteFinancialErrorMessage("RVX-2008")).toBe(
      "We couldn't start your order. Please try again.",
    );
    expect(getAbsoluteFinancialErrorMessage("RVX-2011")).toBe(
      "Totals don't match. Please try again.",
    );
    expect(Object.keys(ABSOLUTE_FINANCIAL_LAW_V1.errorLaw.codes)).toHaveLength(12);
    expect(ABSOLUTE_FINANCIAL_LAW_V1.rootCauseDetectionMode.active).toBe(true);
  });

  it("production pass requires exact 100% + Buy Now→…→Completed chain", () => {
    expect(
      resolveAbsoluteFinancialProductionPass({
        buyNowPass: true,
        checkoutPass: true,
        paymentPass: true,
        successPass: true,
        escrowPass: true,
        completedPass: true,
        financialCertificationPass: true,
        scorePercent: 99.99,
      }),
    ).toBe("PRODUCTION_FAIL");
    expect(
      resolveAbsoluteFinancialProductionPass({
        buyNowPass: true,
        checkoutPass: true,
        paymentPass: true,
        successPass: false,
        escrowPass: true,
        completedPass: true,
        financialCertificationPass: true,
        scorePercent: 100,
      }),
    ).toBe("PRODUCTION_FAIL");
    expect(
      resolveAbsoluteFinancialProductionPass({
        buyNowPass: true,
        checkoutPass: true,
        paymentPass: true,
        successPass: true,
        escrowPass: true,
        completedPass: true,
        financialCertificationPass: true,
        scorePercent: 100,
      }),
    ).toBe("PRODUCTION_PASS_100");
  });

  it("forbids duplicate financial outcomes", () => {
    expect(isDuplicateFinancialOutcomeForbidden("DUPLICATE PAYMENTS")).toBe(true);
    expect(isDuplicateFinancialOutcomeForbidden("MULTIPLE TRANSACTIONS")).toBe(true);
  });

  it("wires into Blood I/XXIII, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      absoluteFinancialLawFreeze: "lib/supreme-blood-code-xxiv-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXxiv: "lib/supreme-blood-code-xxiv-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXxiv: "lib/supreme-blood-code-xxiv-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_XXIII_V1.developmentStatus).toBe("PERMANENTLY_FROZEN");
  });

  it("persists rule and doc", () => {
    const rule = readSource(".cursor/rules/absolute-financial-law-v1.mdc");
    const doc = readSource("docs/engineering/ABSOLUTE_FINANCIAL_LAW_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("1 CLICK = 1 PAYMENT");
    expect(rule).toContain("RVX-2001");
    expect(doc).toContain("Absolute Financial Law");
    expect(doc).toContain("No pass without payment flow pass");
    expect(doc).toContain("PRICE ≠ PAYMENT");
  });
});
