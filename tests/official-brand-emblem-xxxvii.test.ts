import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1,
  certifyOfficialBrandEmblemXxxvii,
  assertOfficialBrandEmblemOrBlock,
  isOfficialBrandEmblemLocked,
} from "@/lib/supreme-blood-law-xxxvii-official-brand-emblem-v1";
import {
  CANONICAL_LOGO_ENGINE_V1,
  CANONICAL_RX_MASTER_FILE,
  OFFICIAL_RX_EMBLEM_ICON_SIZES,
} from "@/lib/brand/canonical-rx-3d-logo-freeze-v1";

describe("Absolute Blood Law XXXVII — Official Brand Emblem", () => {
  it("is supreme, locked, certified, and production ready", () => {
    const law = SUPREME_BLOOD_LAW_XXXVII_OFFICIAL_BRAND_EMBLEM_V1;
    expect(law.bloodLaw).toBe("XXXVII");
    expect(law.status).toBe("SUPREME_LOCKED_CERTIFIED_PRODUCTION_READY");
    expect(law.supreme).toBe(true);
    expect(isOfficialBrandEmblemLocked()).toBe(true);
    expect(law.composition).toEqual(
      expect.arrayContaining([
        "RX Monogram",
        "Protective Hands",
        "BUY • SELL • GROW",
      ]),
    );
  });

  it("locks transparent master formats and icon matrix on disk", () => {
    expect(existsSync(path.join(process.cwd(), "public/brand/canonical-rx/rx-mark-v3.png"))).toBe(
      true,
    );
    expect(
      existsSync(path.join(process.cwd(), "public/brand/canonical-rx/master-emblem-v1.webp")),
    ).toBe(true);
    expect(
      existsSync(path.join(process.cwd(), "public/brand/canonical-rx/master-emblem-v1.avif")),
    ).toBe(true);
    expect(
      existsSync(path.join(process.cwd(), "public/brand/canonical-rx/master-emblem-v1.svg")),
    ).toBe(true);
    for (const size of OFFICIAL_RX_EMBLEM_ICON_SIZES) {
      expect(existsSync(path.join(process.cwd(), `public/icons/icon-${size}.png`))).toBe(true);
    }
    expect(CANONICAL_RX_MASTER_FILE).toBe("/brand/canonical-rx/rx-mark-v3.png");
    expect(CANONICAL_LOGO_ENGINE_V1.bloodLaw).toBe("XXXVII");
    expect(CANONICAL_LOGO_ENGINE_V1.composition).toContain("Protective Hands");
  });

  it("passes official emblem certification and startup wiring", () => {
    const report = certifyOfficialBrandEmblemXxxvii();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.certified).toBe(true);
    expect(() => assertOfficialBrandEmblemOrBlock()).not.toThrow();

    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertOfficialBrandEmblemOrBlock");
  });
});
