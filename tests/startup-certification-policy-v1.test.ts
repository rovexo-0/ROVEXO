import { describe, expect, it, vi } from "vitest";
import {
  STARTUP_CERTIFICATION_POLICY_V1,
  runStartupCertificationGate,
  shouldBlockStartupOnCertificationFailure,
  shouldLoadTestingArtifactsOnStartup,
} from "@/lib/startup/startup-certification-policy-v1";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Startup Certification Policy v1.0", () => {
  it("locks development log-and-continue vs production throw-and-block", () => {
    expect(STARTUP_CERTIFICATION_POLICY_V1.developmentOnFail).toBe("log-and-continue");
    expect(STARTUP_CERTIFICATION_POLICY_V1.productionOnFail).toBe("throw-and-block");
    expect(STARTUP_CERTIFICATION_POLICY_V1.certificationModeOnFail).toBe("throw-and-block");
  });

  it("never loads e2e/playwright artifacts in production unless certification mode", () => {
    expect(shouldLoadTestingArtifactsOnStartup({ NODE_ENV: "production" })).toBe(false);
    expect(
      shouldLoadTestingArtifactsOnStartup({
        NODE_ENV: "production",
        ROVEXO_CERTIFICATION_MODE: "1",
      }),
    ).toBe(true);
    expect(shouldLoadTestingArtifactsOnStartup({ NODE_ENV: "development" })).toBe(true);
    expect(shouldLoadTestingArtifactsOnStartup({ NODE_ENV: "test" })).toBe(true);
  });

  it("does not block ordinary development", () => {
    expect(
      shouldBlockStartupOnCertificationFailure({
        NODE_ENV: "development",
      }),
    ).toBe(false);
  });

  it("blocks production and certification mode", () => {
    expect(
      shouldBlockStartupOnCertificationFailure({
        NODE_ENV: "production",
      }),
    ).toBe(true);
    expect(
      shouldBlockStartupOnCertificationFailure({
        NODE_ENV: "development",
        ROVEXO_LAUNCH_PRIVATE_MODE: "1",
      }),
    ).toBe(true);
    expect(
      shouldBlockStartupOnCertificationFailure({
        NODE_ENV: "development",
        ROVEXO_CERTIFICATION_MODE: "true",
      }),
    ).toBe(true);
  });

  it("does not block Vercel Preview (localhost Full Platform cert remains separate)", () => {
    expect(
      shouldBlockStartupOnCertificationFailure({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
      }),
    ).toBe(false);
  });

  it("logs and continues on development failure without removing the throw path", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = runStartupCertificationGate(
      "TEST GATE",
      () => {
        throw new Error("[BLOOD TEST] FAILED — BLOCK LOADING. detail");
      },
      { NODE_ENV: "development" },
    );
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(false);
    expect(result.error).toContain("BLOCK LOADING");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("rethrows and blocks on production failure", () => {
    expect(() =>
      runStartupCertificationGate(
        "TEST GATE",
        () => {
          throw new Error("[BLOOD TEST] FAILED — BLOCK LOADING. detail");
        },
        { NODE_ENV: "production" },
      ),
    ).toThrow(/BLOCK LOADING/);
  });

  it("wires policy into instrumentation without removing assertCounterOfferCertificationOrBlock", () => {
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("runStartupCertificationGate");
    expect(instrumentation).toContain("startup-certification-policy-v1");
    expect(instrumentation).toContain("assertCounterOfferCertificationOrBlock");
  });
});
