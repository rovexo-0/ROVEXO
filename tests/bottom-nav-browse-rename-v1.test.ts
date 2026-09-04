import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Bottom Navigation Search → Browse SSOT renaming v1.0", () => {
  it("renames bottom tab label to Browse without changing tab id or route", () => {
    const nav = readSource("components/ui/BottomNavigation.tsx");
    expect(nav).toContain('href: "/browse"');
    expect(nav).toContain('t("nav.browse")');
    expect(nav).not.toContain('t("nav.search")');
  });

  it("uses category browse emoji for bottom Browse — not Search magnifier", () => {
    const icon = readSource("components/ui/BottomNavV2Icon.tsx");
    expect(icon).toContain("PLATFORM_EMOJI.browse");
    expect(icon).not.toContain("PLATFORM_EMOJI.search");
    expect(icon).not.toContain("SearchLineIcon");
  });

  it("keeps Header Search magnifier and Search naming", () => {
    const headerIcons = readSource("features/search/components/SearchBarIcons.tsx");
    const en = readSource("lib/i18n/messages/en-GB.ts");
    expect(headerIcons).toContain("SearchBarSearchIcon");
    expect(en).toContain('"nav.search": "Search"');
    expect(en).toContain('"nav.browse": "Browse"');
  });
});
