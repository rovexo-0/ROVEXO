import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_IX_V1,
  isConversationHubHeaderChromeForbidden,
  resolveBloodIxProductPass,
} from "@/lib/supreme-blood-code-ix-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_VIII_V1 } from "@/lib/supreme-blood-code-viii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code IX — Search Bar Removal Only", () => {
  it("locks Master UI Approved markers and scope", () => {
    expect(SUPREME_BLOOD_CODE_IX_V1.codename).toBe("SEARCH_BAR_REMOVAL_ONLY");
    expect(SUPREME_BLOOD_CODE_IX_V1.status).toBe("MASTER_UI_APPROVED");
    expect(SUPREME_BLOOD_CODE_IX_V1.priority0).toBe(true);
    expect(SUPREME_BLOOD_CODE_IX_V1.onlyApprovedChange).toEqual([
      "REMOVE_ROVEXO_LOGO",
      "REMOVE_SEARCH_BAR",
    ]);
    expect(SUPREME_BLOOD_CODE_IX_V1.entryPointOnly).toBe(
      "features/header/HeaderProvider.tsx",
    );
  });

  it("forbids marketplace chrome only on Conversation Hub routes", () => {
    expect(isConversationHubHeaderChromeForbidden("/inbox/conversation/abc")).toBe(true);
    expect(isConversationHubHeaderChromeForbidden("/inbox/conversation")).toBe(true);
    expect(isConversationHubHeaderChromeForbidden("/inbox")).toBe(false);
    expect(isConversationHubHeaderChromeForbidden("/")).toBe(false);
    expect(isConversationHubHeaderChromeForbidden("/search")).toBe(false);
  });

  it("resolves Product PASS only with Owner visual PASS", () => {
    expect(
      resolveBloodIxProductPass({
        searchBarRemoved: true,
        noRegressions: true,
        noUiChanges: true,
        noComponentMovement: true,
        ownerVisualPass: true,
      }),
    ).toBe("PRODUCT_PASS_100");
    expect(
      resolveBloodIxProductPass({
        searchBarRemoved: true,
        noRegressions: true,
        noUiChanges: true,
        noComponentMovement: true,
        ownerVisualPass: false,
      }),
    ).toBe("PRODUCT_FAIL");
  });

  it("wires into Blood I/VIII, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      searchBarRemovalOnly: "lib/supreme-blood-code-ix-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_VIII_V1.childLaws).toMatchObject({
      searchBarRemovalOnly: "lib/supreme-blood-code-ix-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeIx: "lib/supreme-blood-code-ix-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeIx: "lib/supreme-blood-code-ix-v1.ts",
    });
  });

  it("Conversation Hub stays covered by Homepage Search Bar Only unmount (no CSS hide)", () => {
    const provider = readSource("features/header/HeaderProvider.tsx");
    const rule = readSource(".cursor/rules/supreme-blood-code-ix-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_IX_V1.md");
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    const homepageOnly = readSource("lib/header/homepage-search-bar-only-v1.ts");

    expect(provider).toContain("isHomepageSearchBarRoute");
    expect(provider).toContain("mount: false");
    expect(provider).toContain("{chrome.mount ? (");
    expect(provider).not.toContain('className={cn(!chrome.visible && "hidden")}');
    expect(homepageOnly).toContain("Conversation");
    expect(homepageOnly).toContain("mustBe: \"UNMOUNTED\"");
    expect(isConversationHubHeaderChromeForbidden("/inbox/conversation/x")).toBe(true);
    expect(hub).toContain("data-conversation-hub");
    expect(hub).toContain("data-conversation-freeze");
    expect(rule).toContain("alwaysApply: true");
    expect(doc).toContain("Search Bar Removal Only");
  });
});
