import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const CANONICAL_COMPONENTS = [
  "CanonicalPageLayout.tsx",
  "CanonicalPageHeader.tsx",
  "CanonicalSection.tsx",
  "CanonicalMenuRow.tsx",
  "CanonicalCard.tsx",
  "CanonicalInput.tsx",
  "CanonicalSelector.tsx",
  "CanonicalButton.tsx",
  "CanonicalModal.tsx",
  "CanonicalInfoBlock.tsx",
  "CanonicalSwitch.tsx",
  "CanonicalDivider.tsx",
] as const;

describe("ROVEXO Canonical Design System v1.0", () => {
  it("ships global CDS tokens in CSS", () => {
    const css = readSource("styles/rovexo/canonical-ds.css");
    expect(css).toContain("--cds-color-primary: #9333ea");
    expect(css).toContain("--cds-icon-size: 20px");
    expect(css).toContain("--cds-row-min-height: 56px");
    expect(css).toContain("--cds-chevron-size: 18px");
    expect(css).toContain(".cds-menu-row");
    expect(css).toContain(".cds-section__card");
    expect(css).toContain(".cds-menu-row__subtitle");
    expect(css).toContain(".cds-button--primary");
  });

  it("imports canonical-ds.css in the design system entry", () => {
    expect(readSource("styles/rovexo/index.css")).toContain("canonical-ds.css");
  });

  it("exports all 12 canonical components from the barrel", () => {
    const index = readSource("src/components/canonical/index.ts");
    expect(index).toContain("CanonicalPageLayout");
    expect(index).toContain("CanonicalPageHeader");
    expect(index).toContain("CanonicalSection");
    expect(index).toContain("CanonicalMenuRow");
    expect(index).toContain("CanonicalCard");
    expect(index).toContain("CanonicalInput");
    expect(index).toContain("CanonicalSelector");
    expect(index).toContain("CanonicalButton");
    expect(index).toContain("CanonicalModal");
    expect(index).toContain("CanonicalInfoBlock");
    expect(index).toContain("CanonicalSwitch");
    expect(index).toContain("CanonicalDivider");
    expect(index).toContain('CDS_VERSION');
  });

  it.each(CANONICAL_COMPONENTS)("creates %s", (fileName) => {
    const source = readSource(`src/components/canonical/${fileName}`);
    expect(source.length).toBeGreaterThan(0);
  });

  it("uses outline icons only in menu rows — no coloured icon backgrounds", () => {
    const row = readSource("src/components/canonical/CanonicalMenuRow.tsx");
    const css = readSource("styles/rovexo/canonical-ds.css");
    expect(row).toContain("cds-menu-row__icon");
    expect(css).not.toContain("background: rgb(147 51 234");
    expect(css).toContain("color: var(--cds-color-text-primary)");
  });

  it("CanonicalMenuRow matches My Account menu structure", () => {
    const row = readSource("src/components/canonical/CanonicalMenuRow.tsx");
    const menu = readSource("features/account-center/components/AccountMenuSections.tsx");
    expect(row).toContain("ChevronRightLineIcon");
    expect(row).toContain("cds-menu-row__title");
    expect(row).toContain("cds-menu-row__subtitle");
    expect(row).toContain("cds-menu-row__trailing-group");
    expect(row).toContain("cds-menu-row__chevron");
    expect(row).toContain("cds-menu-row__badge");
    expect(menu).toContain("CanonicalMenuRow");
    expect(menu).toContain("CanonicalSection");
    expect(menu).toContain("ac-canonical__menu-icon");
  });

  it("CanonicalMenuRow CSS aligns with ac-canonical row tokens", () => {
    const css = readSource("styles/rovexo/canonical-ds.css");
    const accountCss = readSource("styles/rovexo/account-canonical-v2.css");
    expect(css).toContain("--cds-row-min-height: 56px");
    expect(css).toContain("--cds-row-padding-x: 16px");
    expect(css).toContain("--cds-color-chevron: #cbd5e1");
    expect(accountCss).toContain("min-height: 56px");
    expect(accountCss).toContain("padding: 0 16px");
    expect(accountCss).toContain("color: #cbd5e1");
  });

  it("CanonicalCard supports all required variants", () => {
    const tokens = readSource("src/components/canonical/tokens.ts");
    expect(tokens).toContain('"small"');
    expect(tokens).toContain('"medium"');
    expect(tokens).toContain('"large"');
    expect(tokens).toContain('"info"');
    expect(tokens).toContain('"warning"');
    expect(tokens).toContain('"success"');
    expect(tokens).toContain('"danger"');
  });

  it("CanonicalInput supports all required input types", () => {
    const tokens = readSource("src/components/canonical/tokens.ts");
    for (const type of ["text", "email", "phone", "number", "price", "password", "search", "textarea"]) {
      expect(tokens).toContain(`"${type}"`);
    }
  });

  it("CanonicalSelector supports marketplace selector kinds", () => {
    const selector = readSource("src/components/canonical/CanonicalSelector.tsx");
    expect(selector).toContain("data-cds-selector");
    const tokens = readSource("src/components/canonical/tokens.ts");
    expect(tokens).toContain('"category"');
    expect(tokens).toContain('"currency"');
    expect(tokens).toContain('"language"');
  });

  it("CanonicalModal supports confirm delete warning success information", () => {
    const modal = readSource("src/components/canonical/CanonicalModal.tsx");
    const tokens = readSource("src/components/canonical/tokens.ts");
    for (const variant of ["confirm", "delete", "warning", "success", "information"]) {
      expect(tokens).toContain(`"${variant}"`);
    }
    expect(modal).toContain("cds-modal-backdrop");
  });

  it("CanonicalPageHeader uses account module chrome classes", () => {
    const header = readSource("src/components/canonical/CanonicalPageHeader.tsx");
    expect(header).toContain("rx-page-header");
    expect(header).toContain("cds-header__grid");
    expect(header).toContain("BackLineIcon");
  });

  it("does not modify locked homepage or my account hub", () => {
    const homepage = readSource("app/page.tsx");
    const accountHub = readSource("features/account-center/components/AccountCenterHome.tsx");
    expect(homepage).not.toContain("src/components/canonical");
    expect(accountHub).not.toContain("src/components/canonical");
  });
});
