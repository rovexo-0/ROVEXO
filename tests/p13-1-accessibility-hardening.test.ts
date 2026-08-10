import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("P13.1 accessibility hardening", () => {
  it("provides a global skip link targeting #main-content", () => {
    const shell = read("components/layout/AppShellLayout.tsx");
    const css = read("styles/rovexo/skip-link-v1.css");
    const globals = read("app/globals.css");
    expect(shell).toContain('href="#main-content"');
    expect(shell).toContain("rovexo-skip-link");
    expect(css).toContain(".rovexo-skip-link:focus");
    expect(globals).toContain("skip-link-v1.css");
  });

  it("puts Auth Login/Register content in a single main landmark", () => {
    const auth = read("components/auth/AuthContainer.tsx");
    expect(auth).toMatch(/<main\s+id="main-content"/);
  });

  it("darkens homepage protection / featured contrast tokens to AA", () => {
    const card = read("components/ui/ListingCard.module.css");
    const tokens = read("styles/tokens.css");
    // ListingCard freeze SSOT: use design token; token value must stay AA (#047857).
    expect(card).toContain("color: var(--ds-color-success)");
    expect(tokens).toMatch(/--ds-color-success:\s*#047857/);
    expect(card).toContain("color: #6b21a8");
    expect(card).not.toMatch(/\.protection\s*\{[^}]*color:\s*#059669/s);
  });

  it("removes invalid Search tablist and keeps listbox options on li", () => {
    const chips = read("features/search/components/SearchScopeChips.tsx");
    expect(chips).not.toContain('role="tablist"');
    expect(chips).toContain('role="group"');
    expect(chips).toContain("aria-pressed");

    const sellers = read("features/search/components/SellerResults.tsx");
    expect(sellers).toContain('role="option"');
    expect(sellers).not.toMatch(/<Link[^>]*role="option"/);

    const suggestions = read("features/search/components/SearchSuggestionList.tsx");
    expect(suggestions).toMatch(/<li[\s\S]*role="option"/);
  });

  it("wires reusable focus trap into modal shells", () => {
    const hook = read("hooks/use-focus-trap.ts");
    expect(hook).toContain("export function useFocusTrap");
    expect(hook).toContain('event.key !== "Tab"');

    const modal = read("components/ui/ModalContainer.tsx");
    expect(modal).toContain("useFocusTrap");

    const canonical = read("src/components/canonical/CanonicalModal.tsx");
    expect(canonical).toContain("useFocusTrap");

    const confirm = read("src/components/canonical/dialogs/CanonicalConfirmDialog.tsx");
    expect(confirm).toContain("useFocusTrap");
  });
});
