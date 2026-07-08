import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { isValidProductImageUrl } from "@/lib/media/is-valid-product-image";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "features", "archive"];
const ALLOWED_NEXT_IMAGE = new Set(["components/ui/SafeImage.tsx"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build"]);

function walkTsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkTsxFiles(full, out);
      continue;
    }
    if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function rel(path: string): string {
  return relative(ROOT, path).replace(/\\/g, "/");
}

describe("ROVEXO canonical image safety (v1.0)", () => {
  it("exports SafeImage as the only next/image entry point", () => {
    const offenders: string[] = [];

    for (const dir of SCAN_DIRS) {
      const abs = join(ROOT, dir);
      try {
        statSync(abs);
      } catch {
        continue;
      }

      for (const file of walkTsxFiles(abs)) {
        const relativePath = rel(file);
        if (ALLOWED_NEXT_IMAGE.has(relativePath)) continue;

        const source = readFileSync(file, "utf8");
        if (/from\s+["']next\/image["']/.test(source) || /<Image\b/.test(source)) {
          offenders.push(relativePath);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("rejects empty, null-like, and placeholder product URLs", () => {
    expect(isRenderableImageSrc("")).toBe(false);
    expect(isRenderableImageSrc("   ")).toBe(false);
    expect(isRenderableImageSrc(null)).toBe(false);
    expect(isRenderableImageSrc(undefined)).toBe(false);
    expect(isRenderableImageSrc("null")).toBe(false);
    expect(isRenderableImageSrc("undefined")).toBe(false);
    expect(isRenderableImageSrc(PRODUCT_IMAGE_FALLBACK)).toBe(false);
    expect(isRenderableImageSrc("/placeholder-product.svg")).toBe(false);
    expect(isValidProductImageUrl(PRODUCT_IMAGE_FALLBACK)).toBe(false);
  });

  it("accepts real remote and local image URLs", () => {
    expect(isRenderableImageSrc("https://cdn.example.com/item.jpg")).toBe(true);
    expect(isRenderableImageSrc("/brand/logo.png")).toBe(true);
    expect(isValidProductImageUrl("https://storage.example.com/products/abc.webp")).toBe(true);
  });

  it("documents SafeImage runtime guarantees", () => {
    const source = readFileSync(join(ROOT, "components/ui/SafeImage.tsx"), "utf8");
    expect(source).toContain("fallback=\"hide\"");
    expect(source).toContain("onError");
    expect(source).toContain("@next/next/no-img-element");
    expect(source).toContain("PRODUCT_IMAGE_FALLBACK");
  });

  it("ListingCard uses SafeImage for product imagery", () => {
    const source = readFileSync(join(ROOT, "components/ui/ListingCard.tsx"), "utf8");
    expect(source).toContain("SafeImage");
    expect(source).not.toContain('from "next/image"');
  });
});
