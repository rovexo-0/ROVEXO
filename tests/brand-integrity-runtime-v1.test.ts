import { describe, expect, it, vi } from "vitest";
import {
  BRAND_INTEGRITY_RUNTIME_V1,
  isSourceTreeEnoentError,
  readUtf8SourceOrEmpty,
  shouldSoftFailBrandIntegrityAtRuntime,
} from "@/lib/startup/brand-integrity-runtime-v1";
import { runStartupCertificationGate } from "@/lib/startup/startup-certification-policy-v1";
import { assertOfficialBrandEmblemOrBlock } from "@/lib/supreme-blood-law-xxxvii-official-brand-emblem-v1";
import path from "node:path";

describe("Brand Integrity Runtime Hotfix v1", () => {
  it("locks warn-and-continue policy id", () => {
    expect(BRAND_INTEGRITY_RUNTIME_V1.id).toBe("brand-integrity-runtime-v1");
    expect(BRAND_INTEGRITY_RUNTIME_V1.policy).toContain("warn-and-continue");
  });

  it("soft-fails on Vercel serverless, stay fail-closed in cert mode", () => {
    expect(shouldSoftFailBrandIntegrityAtRuntime({ VERCEL: "1", NODE_ENV: "production" })).toBe(
      true,
    );
    expect(
      shouldSoftFailBrandIntegrityAtRuntime({
        VERCEL: "1",
        ROVEXO_CERTIFICATION_MODE: "1",
      }),
    ).toBe(false);
    // VERCEL wins over VITEST so production-simulation tests can set VERCEL=1
    expect(shouldSoftFailBrandIntegrityAtRuntime({ VITEST: "true", VERCEL: "1" })).toBe(true);
    expect(shouldSoftFailBrandIntegrityAtRuntime({ NODE_ENV: "development" })).toBe(false);
  });

  it("readUtf8SourceOrEmpty never throws on missing paths", () => {
    expect(
      readUtf8SourceOrEmpty(
        path.join(process.cwd(), "components/branding/__does_not_exist__.tsx"),
      ),
    ).toBe("");
  });

  it("detects source-tree ENOENT for branding paths", () => {
    const err = Object.assign(new Error("ENOENT: no such file or directory"), {
      code: "ENOENT",
      path: "/var/task/components/branding/RovexoBrandLogo.tsx",
    });
    expect(isSourceTreeEnoentError(err)).toBe(true);
    expect(isSourceTreeEnoentError(new Error("catalog fingerprint mismatch"))).toBe(false);
  });

  it("runStartupCertificationGate continues on source ENOENT even in production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = runStartupCertificationGate(
      "BLOOD XXXVII Official Brand Emblem",
      () => {
        const e = Object.assign(
          new Error(
            "ENOENT: no such file or directory, open '/var/task/components/branding/RovexoBrandLogo.tsx'",
          ),
          {
            code: "ENOENT",
            path: "/var/task/components/branding/RovexoBrandLogo.tsx",
          },
        );
        throw e;
      },
      { NODE_ENV: "production" },
    );
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("assertOfficialBrandEmblemOrBlock warns and continues under Vercel", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const prev = process.env.VERCEL;
    process.env.VERCEL = "1";
    expect(() => assertOfficialBrandEmblemOrBlock()).not.toThrow();
    process.env.VERCEL = prev;
    warn.mockRestore();
  });
});
