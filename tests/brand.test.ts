import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

describe("Official ROVEXO brand", () => {
  it("uses RovexoAppIconMark in header logo", () => {
    const logo = readFileSync(path.join(process.cwd(), "components/brand/RovexoLogo.tsx"), "utf8");
    expect(logo).toContain("RovexoAppIconMark");
    expect(logo).not.toContain("LogoGlyph");
    expect(logo).not.toContain("bg-[image:var(--ds-gradient-primary)]");
  });

  it("ships generated web and mobile icon assets", () => {
    const required = [
      "public/favicon.ico",
      "public/favicon.svg",
      "public/icons/icon-192.png",
      "public/icons/icon-512.png",
      "public/icons/icon-maskable-512.png",
      "public/brand/og-image.png",
      "app/apple-icon.png",
      "app/icon.png",
      "mobile/ios/AppIcon.appiconset/Contents.json",
      "mobile/android/mipmap-xxxhdpi/ic_launcher_foreground.png",
    ];
    for (const file of required) {
      expect(existsSync(path.join(process.cwd(), file)), file).toBe(true);
    }
  });

  it("references official social and PWA assets in metadata", () => {
    const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    const manifest = readFileSync(path.join(process.cwd(), "app/manifest.ts"), "utf8");
    expect(layout).toContain("/brand/og-image.png");
    expect(layout).toContain("/favicon.svg");
    expect(manifest).toContain("icon-maskable-512.png");
    expect(manifest).toContain("#0B1224");
  });
});
