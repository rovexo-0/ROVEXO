/**
 * ROVEXO Native Photo Picker — Production Device Certification + Deploy Law v1.0
 *
 * STATUS: COD SÂNGE · OWNER LAW · FAIL CLOSED
 *
 * Absolute inequalities (never collapse):
 *   Code Certification ≠ Production Deployment ≠ Production Device Certification
 *
 * Localhost SHALL NEVER certify the Native Photo Picker.
 * CERTIFIED only after successful LIVE Production verification on REAL devices
 * (Android + iPhone).
 *
 * SSOT companion rule:
 *   .cursor/rules/native-photo-picker-production-device-cert-v1.mdc
 */

export const NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1 = {
  version: "1.0",
  id: "native-photo-picker-production-device-certification-v1",
  status: "LAW_LOCKED",
  deployLaw: "NATIVE_PHOTO_PICKER_DEPLOY_LAW_V1",

  localhostAloneForbidden: true,
  certificationRequiresLiveProduction: true,
  certificationRequiresRealDevices: true,

  /** Code ≠ Deploy ≠ Device — never treat as equivalent. */
  inequalities: {
    codeCertificationIsNotProductionDeployment: true,
    productionDeploymentIsNotProductionDeviceCertification: true,
    onlyLiveProductionRealDevicesGrantCertified: true,
  } as const,

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

  /** Phase I complete → READY TO COMMIT (not CERTIFIED). */
  afterPhaseI: "READY TO COMMIT" as const,
  /** Phase II complete → READY FOR DEPLOY (not CERTIFIED). */
  afterPhaseII: "READY FOR DEPLOY" as const,

  developerGates: [
    "TypeScript",
    "ESLint",
    "Production Build",
    "Unit Tests",
    "Native Photo Picker Contract",
  ] as const,

  productionSmokeUrl: "https://www.rovexo.co.uk/sell",

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
    "NOT CERTIFIED",
    "Collect evidence",
    "Identify root cause",
    "Fix",
    "Regression Tests",
    "Redeploy",
    "Repeat Owner Device Certification",
  ] as const,

  authority: {
    developer: ["Implementation", "Code Quality", "Build", "Tests", "Deployment"] as const,
    owner: ["Real Device Validation", "Production Behaviour", "Final Acceptance"] as const,
  } as const,

  gates: {
    codeCertification: "REQUIRED",
    commit: "REQUIRED",
    productionDeploy: "REQUIRED",
    productionSmokeTest: "REQUIRED",
    ownerDeviceCertification: "REQUIRED",
  } as const,

  /**
   * Machine / localhost / unit evidence may mark code PASS.
   * They must NEVER imply Owner device PASS.
   */
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
  productionDeployment: "PASS" | "FAIL" | "PENDING";
  productionSmokeTest: "PASS" | "FAIL" | "PENDING";
  ownerDeviceCertification: NativePhotoPickerProductionDeviceCertStatus;
  nativePhotoPicker: NativePhotoPickerCertificationVerdict;
};

/**
 * Absolute: localhost / CI alone cannot grant certification.
 */
export function assertNativePhotoPickerNotCertifiableOnLocalhostAlone(): void {
  if (!NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.localhostAloneForbidden) {
    throw new Error("Native Photo Picker: localhost-alone certification must remain forbidden.");
  }
  if (!NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.ssotCertifiedForbiddenUntilOwnerDevices) {
    throw new Error(
      "Native Photo Picker: SSOT must keep certification blocked until Owner Production Device PASS.",
    );
  }
  if (
    !NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.inequalities
      .onlyLiveProductionRealDevicesGrantCertified
  ) {
    throw new Error("Native Photo Picker: Deploy Law inequalities must remain locked.");
  }
}

/**
 * Code gates may PASS. Certification stays NOT CERTIFIED until Owner Production devices PASS.
 */
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

/**
 * Status board — CERTIFIED only when deploy + Owner devices PASS on live Production.
 */
export function resolveNativePhotoPickerDeployBoard(input: {
  codeCertificationPass: boolean;
  commitPass: boolean;
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
    productionDeployment: input.productionDeployPass ? "PASS" : "PENDING",
    productionSmokeTest: input.productionSmokePass ? "PASS" : "PENDING",
    ownerDeviceCertification: input.ownerDeviceCertification,
    nativePhotoPicker,
  };
}
