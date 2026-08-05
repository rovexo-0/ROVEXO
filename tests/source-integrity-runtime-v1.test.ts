import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
  __resetSourceIntegrityWarningLatchForTests,
  isSourceIntegrityBloodLawLabel,
  isSourceTreeCertificationFailure,
  isSourceTreePath,
  readSourceUtf8,
  shouldSkipSourceTreeVerificationAtRuntime,
} from "@/lib/startup/source-integrity-runtime-v1";
import { runStartupCertificationGate } from "@/lib/startup/startup-certification-policy-v1";

describe("Source Integrity Runtime v1.0", () => {
  afterEach(() => {
    __resetSourceIntegrityWarningLatchForTests();
    vi.restoreAllMocks();
  });

  it("skips source-tree verification on Vercel", () => {
    expect(shouldSkipSourceTreeVerificationAtRuntime({ VERCEL: "1" })).toBe(true);
    expect(
      shouldSkipSourceTreeVerificationAtRuntime({
        VERCEL: "1",
        ROVEXO_CERTIFICATION_MODE: "1",
      }),
    ).toBe(false);
  });

  it("classifies source-tree paths only", () => {
    expect(isSourceTreePath("features/inbox/components/ConversationHub.tsx")).toBe(true);
    expect(isSourceTreePath("lib/offers/counter-offer-engine-v1.ts")).toBe(true);
    expect(isSourceTreePath("styles/rovexo/auth-v1.css")).toBe(true);
    expect(isSourceTreePath("node_modules/foo/bar.ts")).toBe(false);
  });

  it("labels Blood XXXVII–XLV as source-integrity laws", () => {
    expect(isSourceIntegrityBloodLawLabel("BLOOD XLIII Counter Offer Certification")).toBe(
      true,
    );
    expect(isSourceIntegrityBloodLawLabel("BLOOD XLIV Full Demo")).toBe(true);
    expect(isSourceIntegrityBloodLawLabel("BLOOD XLV Final Live")).toBe(true);
    expect(isSourceIntegrityBloodLawLabel("BLOOD XXXII Catalog")).toBe(false);
    expect(isSourceIntegrityBloodLawLabel("Catalog Master Startup Gate")).toBe(false);
  });

  it("detects XLIII-style file-missing failures as source integrity", () => {
    expect(
      isSourceTreeCertificationFailure(
        new Error(
          "[BLOOD XLIII] Counter Offer Certification FAILED — BLOCK LOADING. ConversationHub file missing (features/inbox/components/ConversationHub.tsx)",
        ),
      ),
    ).toBe(true);
  });

  it("does not treat Stripe/DB errors as source integrity", () => {
    expect(
      isSourceTreeCertificationFailure(new Error("Stripe API key missing")),
    ).toBe(false);
    expect(
      isSourceTreeCertificationFailure(new Error("Supabase connection refused")),
    ).toBe(false);
  });

  it("reads real monorepo source when available", () => {
    const result = readSourceUtf8("instrumentation.ts");
    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.content).toContain("register");
    }
  });

  it("soft-continues XLIII file-missing on Vercel production via shared gate", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = runStartupCertificationGate(
      "BLOOD XLIII Counter Offer Certification",
      () => {
        throw new Error(
          "[BLOOD XLIII] FAILED — BLOCK LOADING. Counter Offer Engine file missing (lib/offers/counter-offer-engine-v1.ts)",
        );
      },
      { NODE_ENV: "production", VERCEL: "1" },
    );
    // When source tree IS available locally, skip-ahead may not trigger;
    // catch path must still soft-continue for source-integrity failures.
    expect(result.blocked).toBe(false);
    expect(result.sourceIntegritySkipped).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("still blocks non-source production failures on Vercel", () => {
    expect(() =>
      runStartupCertificationGate(
        "BLOOD TEST",
        () => {
          throw new Error("Stripe webhook secret invalid");
        },
        { NODE_ENV: "production", VERCEL: "1" },
      ),
    ).toThrow(/Stripe webhook/);
  });

  it("exports SOURCE_NOT_AVAILABLE_IN_SERVERLESS sentinel", () => {
    expect(SOURCE_NOT_AVAILABLE_IN_SERVERLESS).toBe("SOURCE_NOT_AVAILABLE_IN_SERVERLESS");
  });
});
