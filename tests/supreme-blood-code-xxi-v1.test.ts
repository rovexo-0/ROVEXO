import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XXI_V1,
  isBloodXxiPriorityZeroSurface,
  resolveBloodXxiPermanentFreeze,
} from "@/lib/supreme-blood-code-xxi-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { publishPhaseLabel } from "@/lib/sell/publish-engine";
import { SELL_ABSOLUTE_AUTHORITY_FREEZE_V1 } from "@/lib/sell/sell-absolute-authority-freeze-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XXI — Priority Zero Execution", () => {
  it("locks Priority Zero Photo · Publish · Success (frozen via Blood XXII)", () => {
    expect(SUPREME_BLOOD_CODE_XXI_V1.codename).toBe(
      "SPRINT_V_SELL_PRIORITY_ZERO_EXECUTION",
    );
    expect(SUPREME_BLOOD_CODE_XXI_V1.status).toBe(
      "100_COMPLETE_OWNER_CERTIFIED_PERMANENT_FREEZE",
    );
    expect(SUPREME_BLOOD_CODE_XXI_V1.priorityZero).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXI_V1.permanentlyFrozen).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXI_V1.priorityZeroOrder).toEqual([
      "PHOTO_EXPERIENCE",
      "PUBLISH_EXPERIENCE",
      "SUCCESS_PAGE_EXPERIENCE",
    ]);
    expect(SUPREME_BLOOD_CODE_XXI_V1.localhostLaw.official).toBe(
      "http://localhost:3000/sell",
    );
    expect(isBloodXxiPriorityZeroSurface("photo")).toBe(true);
    expect(isBloodXxiPriorityZeroSurface("other")).toBe(false);
  });

  it("publish states match Blood XXI user-facing copy", () => {
    expect(publishPhaseLabel("validating")).toBe("Publishing…");
    expect(publishPhaseLabel("uploading")).toBe("Please wait…");
    expect(publishPhaseLabel("uploading", { uploadProgress: 40 })).toBe(
      "Please wait… 40%",
    );
    expect(publishPhaseLabel("creating")).toBe("Please wait…");
    expect(publishPhaseLabel("finalising")).toBe("Please wait…");
    expect(publishPhaseLabel("published")).toBe(
      "Listing successfully published.",
    );
  });

  it("success page allows only three Blood XXI actions", () => {
    expect(SUPREME_BLOOD_CODE_XXI_V1.priorityIIISuccess.actionsOnly).toEqual([
      "View Listing",
      "Share Listing",
      "Sell Another Item",
    ]);
    expect(SELL_ABSOLUTE_AUTHORITY_FREEZE_V1.success.title).toBe(
      "Listing successfully published",
    );
    expect(SELL_ABSOLUTE_AUTHORITY_FREEZE_V1.success.actions).toEqual([
      "View Listing",
      "Share Listing",
      "Sell Another Item",
    ]);
  });

  it("freeze requires Priority Zero + Owner certification chain", () => {
    expect(
      resolveBloodXxiPermanentFreeze({
        photoExperiencePass: true,
        publishExperiencePass: true,
        successPageExperiencePass: true,
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        complete100: true,
        noRegressionPass: true,
      }),
    ).toBe("NOT_READY");
    expect(
      resolveBloodXxiPermanentFreeze({
        photoExperiencePass: true,
        publishExperiencePass: true,
        successPageExperiencePass: true,
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: true,
        noRegressionPass: true,
      }),
    ).toBe("PERMANENT_FREEZE");
  });

  it("wires into Blood I/XX, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintVSellPriorityZeroExecution: "lib/supreme-blood-code-xxi-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXxi: "lib/supreme-blood-code-xxi-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXxi: "lib/supreme-blood-code-xxi-v1.ts",
    });
  });

  it("persists Priority Zero stamps on Sell photo · publish · success", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xxi-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XXI_V1.md");
    const sellPage = readSource("features/sell/ui/SellPage.tsx");
    const photos = readSource("features/sell/ui/SellPhotoRail.tsx");
    const overlay = readSource("components/sell/PublishingOverlay.tsx");
    const success = readSource("components/sell/PublishSuccessDialog.tsx");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("PRIORITY ZERO");
    expect(doc).toContain("Priority Zero");
    expect(sellPage).toContain('data-blood-code-xxi="21.0"');
    expect(sellPage).toContain('data-sell-priority-zero="photo-publish-success"');
    expect(photos).toContain('data-blood-code-xxi-photo="1"');
    expect(photos).toContain("/placeholder-product.svg");
    expect(overlay).toContain('data-blood-code-xxi-publish="1"');
    expect(overlay).toContain("aria-busy");
    expect(success).toContain("Listing successfully published");
    expect(success).toContain("Share Listing");
    expect(success).toContain("Sell Another Item");
    expect(success).toContain('data-blood-code-xxi-success="1"');
  });
});
