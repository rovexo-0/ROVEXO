import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("MobileHeaderScrollContext regression", () => {
  it("does not bump header version on registerHeader", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/home/MobileHeaderScrollContext.tsx"),
      "utf8",
    );

    expect(source).not.toContain("setHeaderVersion");
    expect(source).not.toMatch(/headerVersion/);
  });

  it("memoizes provider context value", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/home/MobileHeaderScrollContext.tsx"),
      "utf8",
    );

    expect(source).toContain("useMemo");
    expect(source).toContain("registerHeader");
  });

  it("keeps Header registration in useLayoutEffect instead of ref callback", () => {
    const source = readFileSync(
      path.join(process.cwd(), "components/Header.tsx"),
      "utf8",
    );

    expect(source).toContain("const registerHeader = scroll?.registerHeader");
    expect(source).toContain("useLayoutEffect");
    expect(source).toContain("[registerHeader]");
    expect(source).not.toContain("setHeaderRef");
    expect(source).not.toContain("setHeaderVersion");
  });
});
