import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  FOLLOW_TRUST_CANONICAL_FREEZE_V1,
  assertFollowTrustFreezeOrBlock,
} from "@/lib/follow-trust/follow-trust-canonical-freeze-v1";
import { P0_ARCHITECTURE_CONSOLIDATION_V1 } from "@/lib/reputation/p0-architecture-consolidation-v1";

describe("Follow & Trust Canonical Freeze v1.0", () => {
  it("is permanently frozen until Owner Architecture 2.0", () => {
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.status).toBe("PERMANENTLY_FROZEN");
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.automaticEvolution).toBe(false);
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.exitRequires).toContain(
      "Architecture Version 2.0",
    );
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.architectureChangeRequired.implementRedesign).toBe(
      false,
    );
  });

  it("forbids parallel / temporary / duplicate architectures", () => {
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.forbidden).toEqual(
      expect.arrayContaining([
        "temporary solutions",
        "parallel implementations",
        "duplicate services",
        "duplicate stores",
        "duplicate APIs",
      ]),
    );
  });

  it("requires regression coverage across the ecosystem", () => {
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.regressionMustVerify).toEqual(
      expect.arrayContaining([
        "Follow",
        "Unfollow",
        "Rating",
        "Reviews",
        "Reputation",
        "Badges",
        "Notifications",
        "Following Feed",
        "Admin overrides",
      ]),
    );
  });

  it("preserves P0 singularity under freeze", () => {
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.singularity.reputationApi).toBe(
      P0_ARCHITECTURE_CONSOLIDATION_V1.reputationPublicApi,
    );
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.singularity.badgeApi).toBe(
      P0_ARCHITECTURE_CONSOLIDATION_V1.badgeApi,
    );
    expect(FOLLOW_TRUST_CANONICAL_FREEZE_V1.singularity.sellerPerformance).toContain(
      "internal metrics only",
    );
  });

  it("blocks architecture-change proposals at the gate", () => {
    expect(() => assertFollowTrustFreezeOrBlock()).not.toThrow();
    expect(() =>
      assertFollowTrustFreezeOrBlock({ architectureChangeProposed: true }),
    ).toThrow(/ARCHITECTURE CHANGE REQUIRED/);
  });

  it("ships freeze SSOT + cursor rule", () => {
    expect(
      existsSync(join(process.cwd(), "lib/follow-trust/follow-trust-canonical-freeze-v1.ts")),
    ).toBe(true);
    expect(
      existsSync(join(process.cwd(), ".cursor/rules/follow-trust-canonical-freeze-v1.mdc")),
    ).toBe(true);
  });
});
