import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_V_V1,
  isForbiddenOrderJourneyPage,
  resolveOneHubExperiencePass,
} from "@/lib/supreme-blood-code-v-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1 } from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code V — One Order One Hub", () => {
  it("locks permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_V_V1.codename).toBe("ONE_ORDER_ONE_HUB_ONE_PAGE");
    expect(SUPREME_BLOOD_CODE_V_V1.status).toBe("PERMANENT_FREEZE_APPROVED");
    expect(SUPREME_BLOOD_CODE_V_V1.equation.oneConversationHub).toBe(true);
    expect(SUPREME_BLOOD_CODE_V_V1.equation.onePage).toBe(true);
    expect(SUPREME_BLOOD_CODE_V_V1.goldenEquation).toContain("1 CONVERSATION HUB");
    expect(SUPREME_BLOOD_CODE_V_V1.masterStickyButton.alwaysPresent).toBe(true);
  });

  it("forbids parallel order journey pages", () => {
    expect(isForbiddenOrderJourneyPage("BUY_PAGE")).toBe(true);
    expect(isForbiddenOrderJourneyPage("TRACKING_PAGE")).toBe(true);
    expect(isForbiddenOrderJourneyPage("ISSUE_PAGE")).toBe(true);
    expect(SUPREME_BLOOD_CODE_V_V1.forbiddenPages).toContain("COMPLETED_PAGE");
    expect(SUPREME_BLOOD_CODE_V_V1.onlyAllowedTemporaryRedirect).toBe("/checkout");
  });

  it("resolves one-hub experience PASS/FAIL", () => {
    expect(
      resolveOneHubExperiencePass({
        stayedInHubExceptCheckout: true,
        stickyCtaPresent: true,
        ownerCanSeeScrollChatBuyPayTrack: true,
        zeroRegressionClean: true,
      }),
    ).toBe("PASS");
    expect(
      resolveOneHubExperiencePass({
        stayedInHubExceptCheckout: false,
        stickyCtaPresent: true,
        ownerCanSeeScrollChatBuyPayTrack: true,
        zeroRegressionClean: true,
      }),
    ).toBe("FAIL");
  });

  it("wires into Blood I, Master Hub, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      oneOrderOneHub: "lib/supreme-blood-code-v-v1.ts",
    });
    expect(MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.childLaws).toMatchObject({
      supremeBloodCodeV: "lib/supreme-blood-code-v-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeV: "lib/supreme-blood-code-v-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeV: "lib/supreme-blood-code-v-v1.ts",
    });
  });

  it("keeps always-apply rule, doc, and ConversationHub SSOT in sync", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-v-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_V_V1.md");
    const hub = readSource(SUPREME_BLOOD_CODE_V_V1.canonicalSurface.component);
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("1 ORDER = 1 CONVERSATION HUB = 1 PAGE");
    expect(doc).toContain("PERMANENT FREEZE APPROVED");
    expect(hub).toContain("data-conversation-hub");
    expect(hub).toContain("MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1");
    expect(hub).toContain("data-master-buyer-hub");
    expect(hub).toContain("data-master-stack");
  });
});
