import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PHASE_B_UI_CLEANUP_V1 } from "@/lib/ui/phase-b-ui-cleanup-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase B UI cleanup locks", () => {
  it("keeps scope polish-only", () => {
    expect(PHASE_B_UI_CLEANUP_V1.status).toBe("ACTIVE");
    expect(PHASE_B_UI_CLEANUP_V1.forbidden).toContain("business-logic");
    expect(PHASE_B_UI_CLEANUP_V1.forbidden).toContain("new-features");
  });

  it("locks search text at 16px for iOS zoom prevention", () => {
    expect(readSource("features/search/components/SearchBarIcons.tsx")).toContain(
      "SEARCH_BAR_TEXT_PX = 16",
    );
    expect(readSource("styles/rovexo/search-landing-v1.css")).toContain("font-size: 16px");
    expect(readSource("styles/rovexo/homepage-header.css")).toContain("font-size: 16px");
  });

  it("locks Profile menu icons at 24px SSOT", () => {
    const css = readSource("styles/rovexo/account-canonical-v2.css");
    expect(css).toContain(".ac-canonical__menu-icon");
    expect(css).toMatch(/\.ac-canonical__menu-icon\s*\{[^}]*width:\s*24px/s);
    expect(css).not.toMatch(/\.ac-canonical__menu-icon\s*\{[^}]*width:\s*22px/s);
  });

  it("locks Wallet primary CTA to Master 56px", () => {
    const css = readSource("styles/rovexo/wallet-hub-v1.css");
    expect(css).toMatch(/\.wallet-v2__cta\s*\{[^}]*height:\s*56px/s);
  });

  it("locks account sticky action safe-area padding", () => {
    expect(readSource("styles/rovexo/account-settings-ui.css")).toContain(
      "env(safe-area-inset-bottom",
    );
  });
});
