import { describe, expect, it } from "vitest";
import { BUILD_ABSOLUTE_LAW_V1 } from "@/lib/build-absolute-law-v1";
import { PRIORITY_0_BUILD_MUST_LIVE_V1 } from "@/lib/priority-0-build-must-live-v1";

describe("ROVEXO Build Absolute Law v1.0", () => {
  it("locks localhost-only development and binary pass states", () => {
    expect(BUILD_ABSOLUTE_LAW_V1.developmentOnly).toBe("http://localhost:3000");
    expect(BUILD_ABSOLUTE_LAW_V1.productionPolicy).toBe("SECURITY_FIX_ONLY");
    expect(BUILD_ABSOLUTE_LAW_V1.binaryStates).toEqual([0, 100]);
    expect(BUILD_ABSOLUTE_LAW_V1.equation).toBe("NO_BUILD_PASS = NO_CERTIFICATION");
    expect(BUILD_ABSOLUTE_LAW_V1.developmentChain[0]).toBe("BUILD_PASS");
    expect(BUILD_ABSOLUTE_LAW_V1.defaultStatusUntilOwnerPass).toBe("IN_DEVELOPMENT");
    expect(BUILD_ABSOLUTE_LAW_V1.forbidden).toContain("CERTIFY_BUY_NOW_WHEN_BUILD_FAILS");
    expect(PRIORITY_0_BUILD_MUST_LIVE_V1.productDoesNotExistIfFail).toContain("BUILD");
  });
});
