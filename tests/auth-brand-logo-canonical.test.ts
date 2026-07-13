import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const AUTH_ROOTS = [
  "app/(auth)",
  "features/auth/components",
  "components/auth",
  "components/branding/RovexoBrandLogo.tsx",
];

const ALLOWED_RX_ICON_FILES = new Set([
  path.normalize("features/auth/components/SplashScreen.tsx"),
  path.normalize("app/(auth)/splash/page.tsx"),
  path.normalize("app/(auth)/splash/layout.tsx"),
]);

function collectFiles(relativePath: string): string[] {
  const absolute = path.join(process.cwd(), relativePath);
  if (!statSync(absolute, { throwIfNoEntry: false })?.isDirectory()) {
    return [relativePath];
  }

  const entries = readdirSync(absolute, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const next = path.join(relativePath, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      if (entry.name === "splash") continue;
      files.push(...collectFiles(next));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(next);
    }
  }
  return files;
}

describe("AUTH brand logo canonical v1.0", () => {
  it("defines RovexoBrandLogo as the single auth brand SSOT", () => {
    const brand = readFileSync(
      path.join(process.cwd(), "components/branding/RovexoBrandLogo.tsx"),
      "utf8",
    );
    expect(brand).toContain("RovexoWordmark");
    expect(brand).toContain("BUY.");
    expect(brand).toContain("SELL.");
    expect(brand).toContain("GROW.");
    expect(brand).not.toContain("RovexoAppIconMark");
  });

  it("locks auth brand dimensions and spacing in CSS", () => {
    const css = readFileSync(path.join(process.cwd(), "styles/rovexo/auth-v1.css"), "utf8");
    expect(css).toContain(".rovexo-brand-logo");
    expect(css).toContain("width: 220px");
    expect(css).toContain("width: 280px");
    expect(css).toContain("margin-top: max(env(safe-area-inset-top), 48px)");
    expect(css).toContain("margin-bottom: 32px");
  });

  it("uses RovexoBrandLogo on every auth screen except splash", () => {
    const files = AUTH_ROOTS.flatMap((root) => collectFiles(root));
    const offenders = files.filter((file) => {
      if (ALLOWED_RX_ICON_FILES.has(path.normalize(file))) return false;
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      return source.includes("RovexoAppIconMark");
    });

    expect(offenders).toEqual([]);
  });

  it("wires RovexoBrandLogo on welcome, login, and register", () => {
    for (const screen of [
      "features/auth/components/WelcomeScreen.tsx",
      "features/auth/components/LoginScreen.tsx",
      "features/auth/components/RegisterScreen.tsx",
      "features/auth/components/AuthForm.tsx",
    ]) {
      const source = readFileSync(path.join(process.cwd(), screen), "utf8");
      expect(source).toContain("RovexoBrandLogo");
      expect(source).not.toContain("RovexoAppIconMark");
    }
  });
});
