import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XL_REGISTER_VISUAL_POLISH_FREEZE_V1,
  REGISTER_EMBLEM_BACK_OFFSET_PX,
  certifyRegisterVisualPolishFreezeXl,
  assertRegisterVisualPolishFreezeOrBlock,
} from "@/lib/supreme-blood-law-xl-register-visual-polish-freeze-v1";

describe("Absolute Blood Law XL — Register Visual Polish Freeze", () => {
  it("locks register visual polish contract", () => {
    const law = SUPREME_BLOOD_LAW_XL_REGISTER_VISUAL_POLISH_FREEZE_V1;
    expect(law.bloodLaw).toBe("XL");
    expect(law.status).toBe("LOCKED_CERTIFIED_PRODUCTION_READY");
    expect(law.targetPage).toBe("/register");
    expect(REGISTER_EMBLEM_BACK_OFFSET_PX).toBe(10);
    expect(law.approvedAdjustment.offsetPxMin).toBe(8);
    expect(law.approvedAdjustment.offsetPxMax).toBe(12);
  });

  it("applies only Register brand container offset", () => {
    const css = readFileSync(
      path.join(process.cwd(), "styles/rovexo/auth-v1.css"),
      "utf8",
    );
    expect(css).toMatch(
      /auth-register--canonical-freeze\s+\.auth-register__brand\s*\{[^}]*margin-top:\s*10px/s,
    );
    const register = readFileSync(
      path.join(process.cwd(), "features/auth/components/RegisterScreen.tsx"),
      "utf8",
    );
    expect(register).toContain('data-register-visual-polish="XL"');
  });

  it("passes register visual polish certification and startup gate", () => {
    const report = certifyRegisterVisualPolishFreezeXl();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(() => assertRegisterVisualPolishFreezeOrBlock()).not.toThrow();
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertRegisterVisualPolishFreezeOrBlock");
  });
});
