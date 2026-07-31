import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MASTER_FULL_WIDTH_CONTRACT_DOM,
  MASTER_FULL_WIDTH_CONTRACT_STATUS,
  MASTER_FULL_WIDTH_TOKENS,
  masterFullWidthContractSnapshot,
} from "@/lib/master-engine/master-full-width-contract-v1";
import {
  FULL_WIDTH_ENGINE_SPEC,
  FULL_WIDTH_REFERENCE_PAGE,
  getFullWidthEngineSnapshot,
} from "@/lib/master-engine/full-width-engine";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walkTsx(full, out);
    } else if (name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

describe("Master Full Width Contract v1.1 (Design Decision #001)", () => {
  it("locks Owner tokens and Profile reference", () => {
    const snap = masterFullWidthContractSnapshot();
    expect(snap.status).toBe(MASTER_FULL_WIDTH_CONTRACT_STATUS);
    expect(snap.version).toBe("1.1");
    expect(snap.tokens).toEqual(MASTER_FULL_WIDTH_TOKENS);
    expect(MASTER_FULL_WIDTH_TOKENS.fullWidth).toBe("100%");
    expect(MASTER_FULL_WIDTH_TOKENS.maxWidth).toBe("none");
    expect(MASTER_FULL_WIDTH_TOKENS.headerPx).toBe(64);
    expect(MASTER_FULL_WIDTH_TOKENS.primaryButtonPx).toBe(56);
    expect(MASTER_FULL_WIDTH_TOKENS.paddingLeftPx).toBe(16);
    expect(MASTER_FULL_WIDTH_TOKENS.paddingRightPx).toBe(16);
    expect(MASTER_FULL_WIDTH_TOKENS.homepagePaddingLeftPx).toBe(16);
    expect(MASTER_FULL_WIDTH_TOKENS.homepagePaddingRightPx).toBe(16);
    expect(MASTER_FULL_WIDTH_TOKENS.sectionSpacingPx).toBe(24);
    expect(MASTER_FULL_WIDTH_TOKENS.inputHeightPx).toBe(56);
    expect(MASTER_FULL_WIDTH_TOKENS.touchTargetMinPx).toBe(44);
    expect(FULL_WIDTH_REFERENCE_PAGE).toBe("profile");
    expect(FULL_WIDTH_ENGINE_SPEC.headerPx).toBe(64);
    expect(FULL_WIDTH_ENGINE_SPEC.sectionSpacingPx).toBe(24);
    expect(getFullWidthEngineSnapshot().contractDom).toBe(MASTER_FULL_WIDTH_CONTRACT_DOM);
  });

  it("ships CSS with 100% width and Owner spacing (internal 16 · homepage content 16 · header 24)", () => {
    const css = readSource("styles/rovexo/full-width-engine-v1.css");
    expect(css).toContain("--fw-width: 100%");
    expect(css).toContain("--fw-max-width: none");
    expect(css).toContain("--fw-pad-x: 16px");
    expect(css).toContain("--homepage-pad-x: 24px");
    expect(css).toContain("--hp-shell-pad: 16px");
    expect(css).toContain("--fw-pad-y: 24px");
    expect(css).toContain("--fw-header-height: 64px");
    expect(css).toContain("--fw-section-gap: 24px");
    expect(css).toContain("--fw-input-height: 56px");
    expect(css).toContain("--fw-touch-min: 44px");
    expect(css).not.toMatch(/max-width:\s*(320|360|390|420)px/);
    expect(css).toContain("padding: var(--fw-pad-y) var(--fw-pad-x) !important");
    expect(css).toContain(".addresses-v1-edit-sheet");
    expect(css).toContain("max-width: none !important");
  });

  it("stamps contract + Profile master on every AccountCanonicalShell", () => {
    const shell = readSource("features/account-canonical/shell/AccountCanonicalShell.tsx");
    expect(shell).toContain('data-full-width-engine="v1.0"');
    expect(shell).toContain("data-master-full-width={MASTER_FULL_WIDTH_CONTRACT_DOM}");
    expect(shell).toContain("MY_ACCOUNT_V1_DOM");
    expect(shell).toContain("MY_ACCOUNT_V1_MASTER_PAGE");
  });

  it("removes constrained sheet / avatar max-widths in Profile tree", () => {
    expect(readSource("styles/rovexo/account-settings-ui.css")).toContain(
      ".account-settings-edit-sheet {\n  width: 100%;\n  max-width: 100%;",
    );
    expect(readSource("styles/rovexo/addresses-v1.css")).toContain(
      ".addresses-v1-edit-sheet {\n  width: 100%;\n  max-width: 100%;",
    );
    expect(readSource("features/account/components/AvatarUploader.tsx")).not.toContain("max-w-xs");
  });

  it("audits Profile-tree pages: no forbidden percent widths in account shells", () => {
    const roots = [
      "features/account",
      "features/account-center",
      "features/account-module",
      "features/account-canonical",
      "features/wallet",
      "features/help",
      "features/legal",
      "features/support",
      "features/notifications",
    ].map((p) => join(process.cwd(), p));

    const forbidden = [/w-\[70%\]/, /w-\[80%\]/, /w-\[85%\]/, /w-\[90%\]/, /w-\[95%\]/];
    const hits: string[] = [];

    for (const root of roots) {
      for (const file of walkTsx(root)) {
        const src = readFileSync(file, "utf8");
        for (const re of forbidden) {
          if (re.test(src)) hits.push(`${file} → ${re}`);
        }
      }
    }

    expect(hits).toEqual([]);
  });
});
