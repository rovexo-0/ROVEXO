import { describe, expect, it } from "vitest";
import {
  PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1,
  phaseD2GoNoGo,
  phaseD2PrerequisitesPass,
  phaseD2ProductionLockAuthorized,
} from "@/lib/phase-d2-live-deployment-certification-v1";
import { phaseD1GoNoGo } from "@/lib/phase-d1-live-production-certification-v1";
import { OWNER_PREVIEW_ORIGIN } from "@/lib/preview/owner-preview-ssot";

describe("Phase D.2 — Live Deployment Certification (Post-Deploy)", () => {
  it("blocks post-deploy certification until prerequisites PASS", () => {
    expect(PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.status).toBe("BLOCKED");
    expect(PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.officialOrigin).toBe(OWNER_PREVIEW_ORIGIN);
    expect(phaseD2PrerequisitesPass()).toBe(false);
    expect(phaseD2GoNoGo()).toBe("NO-GO");
    expect(phaseD2ProductionLockAuthorized()).toBe(false);
    expect(phaseD1GoNoGo()).toBe("NO-GO");
  });

  it("records missing Owner push/deploy and live lag evidence", () => {
    const p = PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.prerequisites;
    expect(p.ownerGithubPushAuthorized).toBe(false);
    expect(p.ownerVercelProductionDeployAuthorized).toBe(false);
    expect(p.githubPushCompleted).toBe(false);
    expect(p.vercelProductionDeployCompleted).toBe(false);
    expect(PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.liveEvidenceAtEntry.sitemapXmlRoot).toBe(
      "404",
    );
    expect(
      PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.forbiddenWithoutFullPass,
    ).toContain("PRODUCTION_LOCK");
  });
});
