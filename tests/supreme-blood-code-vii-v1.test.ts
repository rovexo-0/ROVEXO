import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_VII_V1,
  isForbiddenLongevityJourneyPage,
  isOwnerLawPass,
  resolveRovexoLongevityPass,
} from "@/lib/supreme-blood-code-vii-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_V_V1 } from "@/lib/supreme-blood-code-v-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code VII — Constitution of Longevity", () => {
  it("locks absolute master freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_VII_V1.codename).toBe("CONSTITUTION_OF_LONGEVITY");
    expect(SUPREME_BLOOD_CODE_VII_V1.status).toBe("ABSOLUTE_MASTER_FREEZE_APPROVED");
    expect(SUPREME_BLOOD_CODE_VII_V1.permanent).toBe(true);
    expect(SUPREME_BLOOD_CODE_VII_V1.goldenEquation.oneSsot).toBe(true);
    expect(SUPREME_BLOOD_CODE_VII_V1.longevityLaw.mustScaleWithoutChangingConstitution).toBe(
      true,
    );
    expect(SUPREME_BLOOD_CODE_VII_V1.longevityUserScale).toContain(500_000_000);
  });

  it("forbids parallel journey pages and requires owner/visual law", () => {
    expect(isForbiddenLongevityJourneyPage("BUY_PAGE")).toBe(true);
    expect(isForbiddenLongevityJourneyPage("COMPLETED_PAGE")).toBe(true);
    expect(SUPREME_BLOOD_CODE_VII_V1.visualLawRequired).toContain("STICKY_CTA");
    expect(SUPREME_BLOOD_CODE_VII_V1.failClosedOnlyShow).toContain("SKELETON");
    expect(isOwnerLawPass([...SUPREME_BLOOD_CODE_VII_V1.ownerLawMust])).toBe(true);
    expect(isOwnerLawPass(["SEE", "CLICK"])).toBe(false);
  });

  it("resolves ROVEXO PASS only when all final-law pillars pass", () => {
    expect(
      resolveRovexoLongevityPass({
        oneOrderOneHubOnePageOneScroll: true,
        automationHundredPercent: true,
        zeroRegression: true,
        longevityRespected: true,
        ownerApproval: true,
        visualCertification: true,
        productPass: true,
      }),
    ).toBe("ROVEXO_PASS");
    expect(
      resolveRovexoLongevityPass({
        oneOrderOneHubOnePageOneScroll: true,
        automationHundredPercent: true,
        zeroRegression: true,
        longevityRespected: true,
        ownerApproval: true,
        visualCertification: false,
        productPass: true,
      }),
    ).toBe("ROVEXO_FAIL");
  });

  it("wires into Blood I/V, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      constitutionOfLongevity: "lib/supreme-blood-code-vii-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_V_V1.childLaws).toMatchObject({
      constitutionOfLongevity: "lib/supreme-blood-code-vii-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeVii: "lib/supreme-blood-code-vii-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeVii: "lib/supreme-blood-code-vii-v1.ts",
    });
  });

  it("keeps always-apply rule, doc, and Hub stamp in sync", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-vii-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_VII_V1.md");
    const hub = readSource(SUPREME_BLOOD_CODE_VII_V1.canonicalHub.component);
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("CONSTITUTION OF LONGEVITY");
    expect(doc).toContain("PERMANENTLY FROZEN");
    expect(doc).toContain("50+ years");
    expect(hub).toContain("data-conversation-hub");
    expect(hub).toContain("data-master-stack");
    expect(SUPREME_BLOOD_CODE_VII_V1.canonicalHub.component).toBe(
      "features/inbox/components/ConversationHub.tsx",
    );
  });
});
