import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PROTOCOL_DOC = "docs/ROVEXO_MASTER_ENGINEERING_PROTOCOL.md";

const BUYER_MODULE_DOCS = [
  "docs/modules/buyer-dashboard/MASTER_ENGINEERING_SPEC.md",
  "docs/modules/buyer-dashboard/Architecture.md",
  "docs/modules/buyer-dashboard/README.md",
  "docs/modules/buyer-dashboard/TESTING.md",
  "docs/modules/buyer-dashboard/CHANGELOG.md",
  "docs/modules/buyer-dashboard/FREEZE_CERTIFICATE.md",
];

describe("ROVEXO Master Engineering Protocol", () => {
  it("publishes the official protocol document", () => {
    expect(existsSync(join(process.cwd(), PROTOCOL_DOC))).toBe(true);
    const content = readFileSync(join(process.cwd(), PROTOCOL_DOC), "utf8");
    expect(content).toContain("PHASE 1");
    expect(content).toContain("PHASE 4");
    expect(content).toContain("Freeze");
  });

  it("maintains the module documentation registry", () => {
    const registry = readFileSync(join(process.cwd(), "docs/modules/README.md"), "utf8");
    expect(registry).toContain("Buyer Dashboard");
    expect(registry).toContain("CanonicalHomepage");
  });

  it("includes the complete Buyer Dashboard documentation package", () => {
    for (const file of BUYER_MODULE_DOCS) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
  });

  it("records Buyer Dashboard freeze status as pending until owner approval", () => {
    const certificate = readFileSync(
      join(process.cwd(), "docs/modules/buyer-dashboard/FREEZE_CERTIFICATE.md"),
      "utf8",
    );
    expect(certificate).toMatch(/PENDING|APPROVED/i);
    expect(certificate).toContain("/buyer");
  });
});
