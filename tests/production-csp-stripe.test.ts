import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PRODUCTION_CSP } from "@/lib/ops/security-headers";

describe("production CSP deployment requirements", () => {
  it("allows Stripe.js script load in built CSP", () => {
    expect(PRODUCTION_CSP).toContain("script-src");
    expect(PRODUCTION_CSP).toMatch(/script-src[^;]*https:\/\/js\.stripe\.com/);
    expect(PRODUCTION_CSP).toMatch(/script-src[^;]*https:\/\/\*\.js\.stripe\.com/);
  });

  it("allows Stripe Payment Element network + frames", () => {
    expect(PRODUCTION_CSP).toContain("https://merchant-ui-api.stripe.com");
    expect(PRODUCTION_CSP).toMatch(/frame-src[^;]*https:\/\/\*\.js\.stripe\.com/);
    expect(PRODUCTION_CSP).toMatch(/frame-src[^;]*https:\/\/hooks\.stripe\.com/);
  });

  it("does not duplicate CSP via vercel.json (next.config is SSOT)", () => {
    const vercelPath = path.join(process.cwd(), "vercel.json");
    const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8")) as { headers?: unknown[] };
    expect(vercel.headers).toBeUndefined();
  });
});
