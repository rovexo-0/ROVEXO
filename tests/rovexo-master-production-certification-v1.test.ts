import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1,
  isMasterProductionReleaseAuthorized,
  listModulesByGate,
  masterProductionCertificationSnapshot,
} from "@/lib/release/rovexo-master-production-certification-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Master Production Certification — ZERO FUNCTION LEFT BEHIND", () => {
  it("records Owner deferrals and keeps only Checkout as release blocker", () => {
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.status).toBe("MASTER_RC_ACTIVE");
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.masterRc).toBe("ACTIVE");
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.ownerDecisions[0]?.id).toBe("RC1-OD-001");
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.ownerDecisions[1]?.id).toBe(
      "RC1-OD-HMRC-001",
    );
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.phases.oauthDeferral).toBe(
      "APPROVED_RC1_OD_001",
    );
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.phases.hmrcLedgerDeferral).toBe(
      "APPROVED_RC1_OD_HMRC_001",
    );
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.phases.hmrcWalkthrough).toBe(
      "PASS_2026_07_31",
    );

    const oauth = ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.modules.find(
      (m) => m.id === "auth_oauth",
    );
    expect(oauth?.gate).toBe("DEFERRED");

    const hmrc = ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.modules.find((m) => m.id === "hmrc");
    expect(hmrc?.gate).toBe("PASS+FREEZE");
    expect(hmrc?.blocker).toBeNull();

    const notReady = listModulesByGate("NOT READY").map((m) => m.id);
    expect(notReady).toEqual(["checkout"]);
    expect(notReady).not.toContain("auth_oauth");
    expect(notReady).not.toContain("hmrc");

    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.releaseBlockers).toHaveLength(1);
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.releaseBlockers[0]).toContain("Checkout");
    expect(
      ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.releaseBlockers.join(" "),
    ).not.toMatch(/HMRC|OAuth|KI-001/i);
  });

  it("never claims production ready or lock while Checkout remains NOT READY", () => {
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.productionReady).toBe(false);
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.productionLock).toBe(false);
    expect(isMasterProductionReleaseAuthorized()).toBe(false);
  });

  it("inventories core marketplace modules without omission", () => {
    const ids = ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.modules.map((m) => m.id);
    for (const required of [
      "homepage",
      "search",
      "sell",
      "listing",
      "checkout",
      "wallet",
      "orders",
      "messages",
      "notifications",
      "profile",
      "settings",
      "help",
      "legal",
      "ideas",
      "hmrc",
      "admin",
      "super_admin",
      "auth_email",
      "auth_oauth",
    ]) {
      expect(ids).toContain(required);
    }
    const snap = masterProductionCertificationSnapshot();
    expect(snap.counts.total).toBe(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.modules.length);
    expect(snap.counts.passFreeze).toBe(22);
    expect(snap.counts.pass).toBe(3);
    expect(snap.counts.notReady).toBe(1);
    expect(snap.counts.deferred).toBe(1);
    expect(snap.masterRc).toBe("ACTIVE");
  });

  it("ships Owner-facing certification report with RC1-OD-001 and RC1-OD-HMRC-001", () => {
    const path = ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.documentation.report;
    expect(existsSync(join(process.cwd(), path))).toBe(true);
    const report = readSource(path);
    expect(report).toContain("MASTER RC");
    expect(report).toContain("RC1-OD-001");
    expect(report).toContain("RC1-OD-HMRC-001");
    expect(report).toContain("DEFERRED (Owner Approved)");
    expect(report).toContain("BLOCKER #1 — Checkout");
    expect(report).toContain("PASS + FREEZE");
    expect(report).toContain("HMRC Reporting Centre");
    expect(readSource("docs/releases/rc1/KNOWN_ISSUES.md")).toContain("RC1-OD-001");
    expect(readSource("docs/releases/rc1/KNOWN_ISSUES.md")).toContain("RC1-OD-HMRC-001");
  });

  it("keeps Phase 6 pipeline with HMRC PASS+FREEZE complete", () => {
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.phase6Pipeline[0]).toBe("MASTER RC ACTIVE");
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.phase6Pipeline[1]).toBe(
      "Checkout Certification",
    );
    expect(ROVEXO_MASTER_PRODUCTION_CERTIFICATION_V1.phase6Pipeline[2]).toBe(
      "HMRC Certification PASS+FREEZE",
    );
  });
});
