import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listMarketplaceIconKeys, MARKETPLACE_ICON_STROKE } from "@/lib/icons/marketplace-line-catalog";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Canonical marketplace icon system v1", () => {
  it("freezes stroke weight and line-only AccountIcons", () => {
    const icons = read("components/account/AccountIcons.tsx");
    expect(icons).toContain(`strokeWidth: ${MARKETPLACE_ICON_STROKE}`);
    expect(icons).not.toContain("fluency-3d");
    expect(icons).not.toContain("/icons/premium/");
    for (const key of listMarketplaceIconKeys()) {
      expect(icons).toContain(`| "${key}"`);
    }
  });

  it("Buying / Messages / Business / Account use dedicated icons", () => {
    expect(read("lib/account-center/buying-menu.ts")).toContain('icon: "tracking"');
    expect(read("lib/account-center/buying-menu.ts")).toContain('icon: "refunds"');
    expect(read("lib/account-center/buying-menu.ts")).toContain('icon: "disputes"');
    expect(read("lib/account-center/messages-menu.ts")).toContain('icon: "inbox"');
    expect(read("lib/account-center/business-menu.ts")).toContain('icon: "directory"');
    expect(read("lib/account-center/canonical-menu.ts")).toContain('icon: "saved"');
    expect(read("lib/account-center/canonical-menu.ts")).toContain('icon: "legal"');
  });

  it("DashboardIcon3D uses AccountIcon family only", () => {
    const source = read("components/icons/DashboardIcon3D.tsx");
    expect(source).toContain("AccountIcon");
    expect(source).not.toContain("getFluency3DAssetPath");
    expect(source).not.toContain("/icons/fluency-3d/");
  });

  it("excludes Homepage Login Register from icon catalog order notes", () => {
    const catalog = read("lib/icons/marketplace-line-catalog.ts");
    expect(catalog).toMatch(/Homepage|Login|Register/);
    expect(catalog).toMatch(/excluded|frozen/i);
  });
});
