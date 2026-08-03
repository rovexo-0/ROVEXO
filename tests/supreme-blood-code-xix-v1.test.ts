import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SUPREME_BLOOD_CODE_XIX_V1,
  isWaitingOwnerCertificationOnly,
  isBloodXixWalletWorkAllowed,
  isBloodXixForbiddenClaim,
  resolveBloodXixPermanentFreeze,
  canStartSprintViFromWalletGate,
} from "@/lib/supreme-blood-code-xix-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_XIV_V1 } from "@/lib/supreme-blood-code-xiv-v1";
import { SUPREME_BLOOD_CODE_XV_V1 } from "@/lib/supreme-blood-code-xv-v1";
import { SUPREME_BLOOD_CODE_XVIII_V1 } from "@/lib/supreme-blood-code-xviii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code XIX — Sprint IV Waiting Owner Certification", () => {
  it("locks WAITING OWNER CERTIFICATION without inventing 100%/freeze", () => {
    expect(SUPREME_BLOOD_CODE_XIX_V1.codename).toBe(
      "SPRINT_IV_WALLET_WAITING_OWNER_CERTIFICATION",
    );
    expect(SUPREME_BLOOD_CODE_XIX_V1.status).toBe("WAITING_OWNER_CERTIFICATION");
    expect(SUPREME_BLOOD_CODE_XIX_V1.developmentFreeze).toBe(true);
    expect(SUPREME_BLOOD_CODE_XIX_V1.permanentlyFrozen).toBe(false);
    expect(SUPREME_BLOOD_CODE_XIX_V1.complete100).toBe(false);
    expect(SUPREME_BLOOD_CODE_XIX_V1.ownerCertified).toBe(false);
    expect(SUPREME_BLOOD_CODE_XIX_V1.productionReady).toBe(false);
    expect(SUPREME_BLOOD_CODE_XIX_V1.nextSprintApproved).toBe(false);
    expect(SUPREME_BLOOD_CODE_XIX_V1.meansOnly).toBe("WAITING_OWNER_CERTIFICATION");
    expect(isWaitingOwnerCertificationOnly("WAITING OWNER CERTIFICATION")).toBe(true);
    expect(SUPREME_BLOOD_CODE_XIX_V1.officialLocalhost).toBe(
      "http://localhost:3000/wallet",
    );
  });

  it("allows only Wallet polish/QA work; forbids freeze/100%/Sprint VI claims", () => {
    expect(isBloodXixWalletWorkAllowed("Wallet Bug Fixes")).toBe(true);
    expect(isBloodXixWalletWorkAllowed("Wallet UI Polish")).toBe(true);
    expect(isBloodXixWalletWorkAllowed("Wallet Mobile Improvements")).toBe(true);
    expect(isBloodXixForbiddenClaim("100% COMPLETE")).toBe(true);
    expect(isBloodXixForbiddenClaim("PERMANENT FREEZE")).toBe(true);
    expect(isBloodXixForbiddenClaim("Starting Sprint VI")).toBe(true);
    expect(isBloodXixForbiddenClaim("Partial Certifications")).toBe(true);
  });

  it("permanent freeze needs all five conditions; waiting without Owner cert", () => {
    expect(
      resolveBloodXixPermanentFreeze({
        automaticCertificationPass: true,
        ownerCertificationPass: false,
        complete100: true,
        zeroRegressionPass: true,
        productionReadyPass: true,
      }),
    ).toBe("WAITING_OWNER_CERTIFICATION");
    expect(
      resolveBloodXixPermanentFreeze({
        automaticCertificationPass: true,
        ownerCertificationPass: true,
        complete100: true,
        zeroRegressionPass: true,
        productionReadyPass: true,
      }),
    ).toBe("PERMANENT_FREEZE");
    expect(
      canStartSprintViFromWalletGate({
        locked: true,
        complete100: true,
        ownerCertified: false,
        permanentlyFrozen: true,
      }),
    ).toBe(false);
    expect(
      canStartSprintViFromWalletGate({
        locked: true,
        complete100: true,
        ownerCertified: true,
        permanentlyFrozen: true,
      }),
    ).toBe(true);
  });

  it("aligns live roadmap with XV/XVIII/XX — IV LOCKED", () => {
    expect(SUPREME_BLOOD_CODE_XIX_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIX_V1.liveSprintStatus.V).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIX_V1.liveSprintStatus.VI).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XV_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XVIII_V1.liveSprintStatus.IV).toBe("LOCKED");
    expect(SUPREME_BLOOD_CODE_XIV_V1.developmentStatus).toBe("LOCKED");
  });

  it("wires into Blood I/XVIII parents, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      sprintIvWalletWaitingOwnerCertification: "lib/supreme-blood-code-xix-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeXix: "lib/supreme-blood-code-xix-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeXix: "lib/supreme-blood-code-xix-v1.ts",
    });
  });

  it("persists rule/doc and stamps Wallet hub", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-xix-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_XIX_V1.md");
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("WAITING OWNER CERTIFICATION");
    expect(rule).toContain("does NOT mean");
    expect(doc).toContain("Waiting Owner Certification");
    expect(doc).toContain("http://localhost:3000/wallet");
    expect(hub).toContain('data-blood-code-xix=');
    expect(hub).toContain('data-wallet-freeze="LOCKED"');
  });
});
