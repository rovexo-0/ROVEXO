import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

/**
 * COD SÂNGE — React #418 hydration root fix.
 * SSR HTML for <html> must equal the first client render (en-GB / ltr / light).
 * Browser-only locale/theme preferences apply only after mount.
 */
describe("React #418 hydration root fix v1", () => {
  it("does not mutate html lang/dir/data-theme before hydration", () => {
    const layout = readSource("app/layout.tsx");
    expect(layout).toContain('lang="en-GB"');
    expect(layout).toContain('dir="ltr"');
    expect(layout).toContain('data-theme="light"');
    expect(layout).not.toContain("rovexo-locale-init");
    expect(layout).not.toContain("rovexo-theme-init");
    expect(layout).not.toContain("LOCALE_INIT_SCRIPT");
    expect(layout).not.toContain("suppressHydrationWarning");
  });

  it("applies stored theme after mount via RovexoThemeProvider", () => {
    const provider = readSource("components/providers/RovexoThemeProvider.tsx");
    expect(provider).toContain("readStoredRovexoTheme");
    expect(provider).toContain("applyRovexoThemeToDocument");
    expect(provider).toContain("useEffect");
  });

  it("applies locale lang/dir only in LocaleProvider effects (not beforeInteractive)", () => {
    const locale = readSource("lib/i18n/provider.tsx");
    expect(locale).toContain("document.documentElement.lang");
    expect(locale).toContain("document.documentElement.dir");
    expect(locale).toContain("useEffect(() => {");
    expect(locale).toContain('(): LocaleCode => "en-GB"');
  });

  it("keeps CookieConsent server snapshot at null (no fake accepted)", () => {
    const banner = readSource("components/legal/CookieConsentBanner.tsx");
    expect(banner).toContain("() => null");
    expect(banner).not.toMatch(/getServerSnapshot[\s\S]*accepted/);
  });
});
