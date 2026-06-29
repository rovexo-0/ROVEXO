import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  enterpriseErrorResponse,
  enterpriseSuccessResponse,
  getRequestCorrelationId,
} from "@/lib/api/enterprise-response";

describe("enterprise API response", () => {
  it("returns structured success payloads", async () => {
    const request = new Request("https://rovexo.test/api/demo", {
      headers: { "x-request-id": "req-test-1" },
    });
    const response = enterpriseSuccessResponse({ ok: true }, { request, startedAt: Date.now() - 5 });
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.requestId).toBe("req-test-1");
    expect(body.data).toEqual({ ok: true });
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.version).toBe("string");
  });

  it("returns structured error payloads", async () => {
    const response = enterpriseErrorResponse("Scan failed.", { status: 500 });
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(body.error).toBe("Scan failed.");
    expect(response.status).toBe(500);
  });

  it("generates correlation ids when missing", () => {
    expect(getRequestCorrelationId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe("PWA service worker", () => {
  it("uses production JavaScript only", () => {
    const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(source).not.toMatch(/\)\s+as\s+/);
    expect(source).not.toMatch(/\b(interface|enum|namespace|declare|implements)\b/);
    expect(source).not.toMatch(/:\s*string\s*[;,)]/);
  });

  it("registers install, activate, fetch, push, and notification handlers", () => {
    const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(source).toContain('addEventListener("install"');
    expect(source).toContain('addEventListener("activate"');
    expect(source).toContain('addEventListener("fetch"');
    expect(source).toContain('addEventListener("push"');
    expect(source).toContain('addEventListener("notificationclick"');
  });
});

describe("PWA manifest route", () => {
  it("defines required manifest fields", async () => {
    const manifestModule = await import("@/app/manifest");
    const manifest = manifestModule.default();

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.display).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.scope).toBeTruthy();
    expect(manifest.icons?.length).toBeGreaterThan(0);
    expect(manifest.shortcuts?.length).toBeGreaterThan(0);
  });
});
