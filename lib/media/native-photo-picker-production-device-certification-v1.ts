/**
 * ROVEXO Native Photo Picker — Auto Production Deploy Law v1.0
 * (extends Production Device Certification SSOT)
 *
 * STATUS: COD SÂNGE · OWNER LAW · FAIL CLOSED
 *
 * Absolute:
 *   NO Production deployment unless all Code Certification gates PASS.
 *   Deployment SHALL stop immediately on any failed gate.
 *   AUTOMATION MAY DEPLOY THE BUILD.
 *   AUTOMATION SHALL NEVER SELF-CERTIFY REAL DEVICE BEHAVIOUR.
 *   CERTIFIED only after live Production + real Android + real iPhone.
 *
 * Inequalities:
 *   Code Certification ≠ Production Deployment ≠ Production Device Certification
 */

export const NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1 = {
  version: "1.0",
  id: "native-photo-picker-production-device-certification-v1",
  status: "LAW_LOCKED",
  deployLaw: "NATIVE_PHOTO_PICKER_DEPLOY_LAW_V1",
  autoProductionDeployLaw: "AUTO_PRODUCTION_DEPLOY_LAW_V1",

  localhostAloneForbidden: true,
  certificationRequiresLiveProduction: true,
  certificationRequiresRealDevices: true,
  automationMayDeploy: true,
  automationShallNeverSelfCertifyDevices: true,

  inequalities: {
    codeCertificationIsNotProductionDeployment: true,
    productionDeploymentIsNotProductionDeviceCertification: true,
    onlyLiveProductionRealDevicesGrantCertified: true,
  } as const,

  deployPrerequisites: [
    "Git Working Tree CLEAN",
    "Commit PASS",
    "Push Origin PASS",
    "TypeScript PASS",
    "ESLint PASS",
    "Production Build PASS",
    "Unit Tests PASS",
    "Mandatory Certification Rules PASS",
  ] as const,

  autoDeployPipeline: [
    "Start Production Deploy",
    "Install Dependencies",
    "Compile",
    "Build (npm run build:production on Vercel — Local Full Platform cert is NOT the Vercel buildCommand)",
    "Generate Static Assets",
    "Runtime Validation",
    "Environment Validation",
    "Deploy",
    "Health Check",
    "Deployment PASS",
  ] as const,

  /**
   * Vercel Production build must never run Local Full Platform (certify:predeploy).
   * That suite requires docs/, reports/, source assets, localhost E2E — excluded from
   * upload by design. Local/CI keep certify:predeploy. Vercel uses build:production.
   */
  vercelProductionBuildCommand: "npm run build:production" as const,
  localFullPlatformNotVercelBuildCommand: true,

  postDeployChecks: [
    "https://www.rovexo.co.uk HTTP 200",
    "Application Boot",
    "Authentication",
    "Homepage",
    "Sell Page",
  ] as const,

  productionSmokeUrl: "https://www.rovexo.co.uk/sell",
  productionOrigin: "https://www.rovexo.co.uk",

  productionSmokeSteps: [
    "Open /sell",
    "Tap Add Photos",
    "Native Photo Picker opens",
    "Select Photos",
    "Automatic Upload",
    "Generate Thumbnails",
    "Progress Indicator",
    "Publish Listing",
  ] as const,

  phases: {
    I_CODE_CERTIFICATION: [
      "TypeScript",
      "ESLint",
      "Production Build",
      "Unit Tests",
      "Native Photo Picker Contract",
    ] as const,
    II_COMMIT: ["Review changes", "Verify clean implementation", "Commit", "Push"] as const,
    III_PRODUCTION_DEPLOYMENT: [
      "Deploy Production",
      "Deployment Success",
      "Smoke Test https://www.rovexo.co.uk/sell",
      "Open Sell Listing",
      "Tap Add Photos",
    ] as const,
    IV_OWNER_DEVICE_CERTIFICATION: ["Android", "iPhone"] as const,
  } as const,

  afterPhaseI: "READY TO COMMIT" as const,
  afterPhaseII: "READY FOR DEPLOY" as const,
  afterPhaseIII: "READY FOR OWNER DEVICE CERTIFICATION" as const,

  developerGates: [
    "TypeScript",
    "ESLint",
    "Production Build",
    "Unit Tests",
    "Native Photo Picker Contract",
  ] as const,

  productionFlow: [
    "Deploy",
    "Production Smoke Test",
    "Open Sell Listing",
    "Tap Add Photos",
  ] as const,

  ownerAndroidSurfaces: [
    "Chrome",
    "Samsung Internet",
    "Pixel",
    "Xiaomi",
    "Motorola",
    "Honor",
    "Oppo",
    "OnePlus",
    "Nothing",
  ] as const,

  ownerIphoneSurfaces: ["Safari", "Chrome", "PWA"] as const,

  requiredProductionTests: [
    "One Tap",
    "Native OS Photo Picker",
    "No ROVEXO dialog",
    "No Action Sheet",
    "No Camera / Gallery popup",
    "Single Photo",
    "Multiple Photos",
    "Automatic Upload",
    "Thumbnail Generation",
    "Progress Indicator",
    "Retry On Genuine Failure",
    "Publish Listing",
    "Edit Listing",
  ] as const,

  failPolicy: [
    "STOP DEPLOYMENT",
    "NO PARTIAL RELEASE",
    "Collect Logs",
    "Identify Root Cause",
    "Fix",
    "Restart Pipeline",
  ] as const,

  deviceFailPolicy: [
    "NOT CERTIFIED",
    "Fix",
    "Redeploy",
    "Repeat Smoke Test",
    "Repeat Owner Device Certification",
  ] as const,

  authority: {
    developer: ["Implementation", "Code Quality", "Build", "Tests", "Deployment"] as const,
    owner: ["Real Device Validation", "Production Behaviour", "Final Acceptance"] as const,
    automation: ["May deploy the build", "Shall never self-certify real device behaviour"] as const,
  } as const,

  gates: {
    codeCertification: "REQUIRED",
    commit: "REQUIRED",
    push: "REQUIRED",
    productionDeploy: "REQUIRED",
    productionSmokeTest: "REQUIRED",
    ownerDeviceCertification: "REQUIRED",
  } as const,

  ssotCertifiedForbiddenUntilOwnerDevices: true,
  productionDeviceCertification: "PENDING" as const,
  finalLabelWhenIncomplete: "NOT CERTIFIED" as const,
} as const;

export type NativePhotoPickerProductionDeviceCertStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "PASS"
  | "FAIL";

export type NativePhotoPickerCertificationVerdict =
  | "NOT CERTIFIED"
  | "CERTIFIED";

export type NativePhotoPickerDeployBoard = {
  codeCertification: "PASS" | "FAIL" | "PENDING";
  commit: "PASS" | "FAIL" | "PENDING";
  push: "PASS" | "FAIL" | "PENDING";
  productionDeployment: "PASS" | "FAIL" | "PENDING";
  productionSmokeTest: "PASS" | "FAIL" | "PENDING";
  ownerDeviceCertification: NativePhotoPickerProductionDeviceCertStatus;
  nativePhotoPicker: NativePhotoPickerCertificationVerdict;
};

export function assertNativePhotoPickerNotCertifiableOnLocalhostAlone(): void {
  if (!NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.localhostAloneForbidden) {
    throw new Error("Native Photo Picker: localhost-alone certification must remain forbidden.");
  }
  if (!NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.ssotCertifiedForbiddenUntilOwnerDevices) {
    throw new Error(
      "Native Photo Picker: SSOT must keep certification blocked until Owner Production Device PASS.",
    );
  }
  if (!NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.automationShallNeverSelfCertifyDevices) {
    throw new Error("Native Photo Picker: automation must never self-certify devices.");
  }
  if (
    !NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.inequalities
      .onlyLiveProductionRealDevicesGrantCertified
  ) {
    throw new Error("Native Photo Picker: Deploy Law inequalities must remain locked.");
  }
}

export function resolveNativePhotoPickerCertificationVerdict(input: {
  codeCertificationPass: boolean;
  productionDeployPass: boolean;
  productionDeviceCertification: NativePhotoPickerProductionDeviceCertStatus;
}): NativePhotoPickerCertificationVerdict {
  assertNativePhotoPickerNotCertifiableOnLocalhostAlone();
  if (
    input.codeCertificationPass &&
    input.productionDeployPass &&
    input.productionDeviceCertification === "PASS"
  ) {
    return "CERTIFIED";
  }
  return "NOT CERTIFIED";
}

export function resolveNativePhotoPickerDeployBoard(input: {
  codeCertificationPass: boolean;
  commitPass: boolean;
  pushPass: boolean;
  productionDeployPass: boolean;
  productionSmokePass: boolean;
  ownerDeviceCertification: NativePhotoPickerProductionDeviceCertStatus;
}): NativePhotoPickerDeployBoard {
  assertNativePhotoPickerNotCertifiableOnLocalhostAlone();
  const nativePhotoPicker = resolveNativePhotoPickerCertificationVerdict({
    codeCertificationPass: input.codeCertificationPass,
    productionDeployPass: input.productionDeployPass && input.productionSmokePass,
    productionDeviceCertification: input.ownerDeviceCertification,
  });
  return {
    codeCertification: input.codeCertificationPass ? "PASS" : "PENDING",
    commit: input.commitPass ? "PASS" : "PENDING",
    push: input.pushPass ? "PASS" : "PENDING",
    productionDeployment: input.productionDeployPass ? "PASS" : "PENDING",
    productionSmokeTest: input.productionSmokePass ? "PASS" : "PENDING",
    ownerDeviceCertification: input.ownerDeviceCertification,
    nativePhotoPicker,
  };
}

/** Fail closed: do not start Production deploy unless prerequisites are all true. */
export function assertAutoProductionDeployAuthorized(input: {
  workingTreeClean: boolean;
  commitPass: boolean;
  pushOriginPass: boolean;
  typeScriptPass: boolean;
  eslintPass: boolean;
  productionBuildPass: boolean;
  unitTestsPass: boolean;
  mandatoryCertificationRulesPass: boolean;
}): void {
  assertNativePhotoPickerNotCertifiableOnLocalhostAlone();
  const failed: string[] = [];
  if (!input.workingTreeClean) failed.push("Git Working Tree CLEAN");
  if (!input.commitPass) failed.push("Commit PASS");
  if (!input.pushOriginPass) failed.push("Push Origin PASS");
  if (!input.typeScriptPass) failed.push("TypeScript PASS");
  if (!input.eslintPass) failed.push("ESLint PASS");
  if (!input.productionBuildPass) failed.push("Production Build PASS");
  if (!input.unitTestsPass) failed.push("Unit Tests PASS");
  if (!input.mandatoryCertificationRulesPass) failed.push("Mandatory Certification Rules PASS");
  if (failed.length > 0) {
    throw new Error(
      `AUTO PRODUCTION DEPLOY BLOCKED — failed gates: ${failed.join(" · ")}. STOP DEPLOYMENT. NO PARTIAL RELEASE.`,
    );
  }
}
