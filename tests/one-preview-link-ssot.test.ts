import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURSOR_LOCAL_ORIGIN,
  OWNER_PREVIEW_CERTIFICATION,
  OWNER_PREVIEW_CONTRACT,
  OWNER_PREVIEW_ORIGIN,
  OWNER_PREVIEW_ORIGIN_DEPRECATED,
  PRODUCTION_ORIGIN,
  ownerPreviewUrl,
} from "@/lib/preview/owner-preview-ssot";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Owner Preview Policy v3.0", () => {
  it("locks one permanent Owner domain", () => {
    expect(OWNER_PREVIEW_ORIGIN).toBe("https://www.rovexo.co.uk");
    expect(PRODUCTION_ORIGIN).toBe("https://www.rovexo.co.uk");
    expect(CURSOR_LOCAL_ORIGIN).toBe("http://localhost:3000");
    expect(ownerPreviewUrl("/wallet")).toBe("https://www.rovexo.co.uk/wallet");
    expect(OWNER_PREVIEW_ORIGIN_DEPRECATED).toBe("https://preview.rovexo.co.uk");
    expect(OWNER_PREVIEW_CONTRACT.version).toBe("v3.0");
    expect(OWNER_PREVIEW_CERTIFICATION.requiredGates).toContain("DNS PASS");
    expect(OWNER_PREVIEW_CERTIFICATION.requiredGates).toContain("OWNER VISUAL APPROVAL");
    expect(OWNER_PREVIEW_CONTRACT.forbidden).toContain(
      "localhost links for Owner approval",
    );
    expect(OWNER_PREVIEW_CONTRACT.forbidden).toContain(
      "screenshots-only or video-only Owner approval",
    );
  });

  it("ships Cursor rules + docs + verify script on www.rovexo.co.uk", () => {
    expect(readSource(".cursor/rules/owner-preview-policy-v3.mdc")).toContain(
      "https://www.rovexo.co.uk",
    );
    expect(readSource(".cursor/rules/one-preview-link-absolute-v1.mdc")).toContain(
      "https://www.rovexo.co.uk",
    );
    expect(readSource("docs/VERCEL_DEVELOPMENT_PREVIEW.md")).toContain(
      "https://www.rovexo.co.uk",
    );
    expect(readSource("scripts/verify-dev-preview.mjs")).toContain(
      "https://www.rovexo.co.uk",
    );
    // Vercel may rewrite vercel.json to compact JSON (`"develop":true` without spaces).
    // Assert semantic git deployment gates, not pretty-print spacing.
    const vercel = JSON.parse(readSource("vercel.json")) as {
      git?: { deploymentEnabled?: Record<string, boolean> };
    };
    expect(vercel.git?.deploymentEnabled?.develop).toBe(true);
    expect(vercel.git?.deploymentEnabled?.main).toBe(true);
  });
});
