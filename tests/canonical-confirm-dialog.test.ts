import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("canonical confirm dialog", () => {
  it("exports CanonicalConfirmDialog from canonical index", () => {
    const index = readSource("src/components/canonical/index.ts");
    expect(index).toContain("CanonicalConfirmDialog");
  });

  it("uses alertdialog semantics and focus trap", () => {
    const dialog = readSource("src/components/canonical/dialogs/CanonicalConfirmDialog.tsx");
    expect(dialog).toContain('role="alertdialog"');
    expect(dialog).toContain("aria-labelledby");
    expect(dialog).toContain("aria-describedby");
    expect(dialog).toContain('event.key === "Escape"');
    expect(dialog).toContain("cds-confirm-dialog");
  });
});

describe("sell photo delete confirmation", () => {
  it("does not use browser-native confirm in sell module", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const action = readSource("features/sell/ui/DeletePhotoAction.tsx");
    expect(rail).not.toContain("window.confirm");
    expect(rail).not.toContain("window.alert");
    expect(rail).not.toContain("window.prompt");
    expect(rail).toContain("DeletePhotoAction");
    expect(action).toContain("CanonicalConfirmDialog");
    expect(action).toContain("Remove photo");
    expect(action).toContain("This photo will be permanently removed from this listing.");
  });
});
