import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  NATIVE_IMAGE_FALLBACK_ACCEPT,
  NATIVE_IMAGE_GALLERY_ACCEPT,
  NATIVE_IMAGE_SUPPORTED_MIME,
  nativeImageFileInputOverlayClassName,
  resolveNativeImageAccept,
  resolveNativeImageCapture,
  sanitizeNativeImagePickerId,
} from "@/lib/media/native-image-picker";
import {
  NATIVE_PHOTO_PICKER_V1,
  UNIVERSAL_PHOTO_PICKER_V1,
  isNativePhotoPickerOneTap,
} from "@/lib/media/universal-photo-picker-v1";
import {
  NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1,
  assertAutoProductionDeployAuthorized,
  assertNativePhotoPickerNotCertifiableOnLocalhostAlone,
  resolveNativePhotoPickerCertificationVerdict,
  resolveNativePhotoPickerDeployBoard,
} from "@/lib/media/native-photo-picker-production-device-certification-v1";
import { SELL_PHOTO_MAX } from "@/features/sell/types";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function walkTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walkTsFiles(full));
      continue;
    }
    if (/\.(tsx?|jsx?)$/.test(entry)) files.push(full);
  }
  return files;
}

describe("Native Photo Picker Contract v1.0", () => {
  it("one tap → native OS picker; forbids ROVEXO Camera/Gallery sheet", () => {
    expect(NATIVE_PHOTO_PICKER_V1.oneTapToNativePicker).toBe(true);
    expect(NATIVE_PHOTO_PICKER_V1.customActionSheetForbidden).toBe(true);
    expect(NATIVE_PHOTO_PICKER_V1.accept).toBe("image/*");
    expect(NATIVE_PHOTO_PICKER_V1.capture).toBeUndefined();
    expect(NATIVE_PHOTO_PICKER_V1.multiple).toBe(true);
    expect(NATIVE_PHOTO_PICKER_V1.listingMax).toBe(10);
    expect(NATIVE_PHOTO_PICKER_V1.autoUploadAfterSelection).toBe(true);
    expect(NATIVE_PHOTO_PICKER_V1.retryOnlyOnGenuineFailure).toBe(true);
    expect(isNativePhotoPickerOneTap()).toBe(true);
    expect(UNIVERSAL_PHOTO_PICKER_V1).toBe(NATIVE_PHOTO_PICKER_V1);
  });

  it("forbids intermediate ROVEXO dialogs", () => {
    for (const token of NATIVE_PHOTO_PICKER_V1.forbiddenUi) {
      expect(NATIVE_PHOTO_PICKER_V1.forbiddenUi).toContain(token);
    }
    expect(existsSync(path.join(process.cwd(), "features/sell/ui/UniversalPhotoPickerSheet.tsx"))).toBe(
      false,
    );
  });
});

describe("Native Photo Picker — Production Device Certification v1.0", () => {
  it("forbids certification on localhost alone", () => {
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.localhostAloneForbidden).toBe(true);
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.certificationRequiresLiveProduction).toBe(
      true,
    );
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.certificationRequiresRealDevices).toBe(true);
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.ssotCertifiedForbiddenUntilOwnerDevices).toBe(
      true,
    );
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.productionDeviceCertification).toBe(
      "PENDING",
    );
    expect(() => assertNativePhotoPickerNotCertifiableOnLocalhostAlone()).not.toThrow();
  });

  it("code+deploy alone still yields NOT CERTIFIED without Owner devices", () => {
    expect(
      resolveNativePhotoPickerCertificationVerdict({
        codeCertificationPass: true,
        productionDeployPass: true,
        productionDeviceCertification: "PENDING",
      }),
    ).toBe("NOT CERTIFIED");
  });

  it("CERTIFIED only when code + deploy + Owner Production devices PASS", () => {
    expect(
      resolveNativePhotoPickerCertificationVerdict({
        codeCertificationPass: true,
        productionDeployPass: true,
        productionDeviceCertification: "PASS",
      }),
    ).toBe("CERTIFIED");
  });

  it("Deploy Law: Code ≠ Commit ≠ Deploy ≠ Device; CERTIFIED only after Owner devices", () => {
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.deployLaw).toBe(
      "NATIVE_PHOTO_PICKER_DEPLOY_LAW_V1",
    );
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.autoProductionDeployLaw).toBe(
      "AUTO_PRODUCTION_DEPLOY_LAW_V1",
    );
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.automationMayDeploy).toBe(true);
    expect(
      NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.automationShallNeverSelfCertifyDevices,
    ).toBe(true);
    expect(
      NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.inequalities
        .codeCertificationIsNotProductionDeployment,
    ).toBe(true);
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.vercelProductionBuildCommand).toBe(
      "npm run build:production",
    );
    expect(NATIVE_PHOTO_PICKER_PRODUCTION_DEVICE_CERT_V1.localFullPlatformNotVercelBuildCommand).toBe(
      true,
    );
    const vercelJson = readSource("vercel.json");
    expect(vercelJson).toContain('"buildCommand": "npm run build:production"');
    expect(vercelJson).not.toContain("certify:predeploy");
    const vercelIgnore = readSource(".vercelignore");
    expect(vercelIgnore).toContain("!app/**/reports");


    const board = resolveNativePhotoPickerDeployBoard({
      codeCertificationPass: true,
      commitPass: true,
      pushPass: true,
      productionDeployPass: false,
      productionSmokePass: false,
      ownerDeviceCertification: "PENDING",
    });
    expect(board).toEqual({
      codeCertification: "PASS",
      commit: "PASS",
      push: "PASS",
      productionDeployment: "PENDING",
      productionSmokeTest: "PENDING",
      ownerDeviceCertification: "PENDING",
      nativePhotoPicker: "NOT CERTIFIED",
    });
  });

  it("Auto Production Deploy blocks when any prerequisite fails", () => {
    expect(() =>
      assertAutoProductionDeployAuthorized({
        workingTreeClean: true,
        commitPass: true,
        pushOriginPass: true,
        typeScriptPass: true,
        eslintPass: true,
        productionBuildPass: true,
        unitTestsPass: true,
        mandatoryCertificationRulesPass: true,
      }),
    ).not.toThrow();

    expect(() =>
      assertAutoProductionDeployAuthorized({
        workingTreeClean: false,
        commitPass: true,
        pushOriginPass: true,
        typeScriptPass: true,
        eslintPass: true,
        productionBuildPass: true,
        unitTestsPass: true,
        mandatoryCertificationRulesPass: true,
      }),
    ).toThrow(/STOP DEPLOYMENT/);
  });
});

describe("sell photo picker (Android / Samsung / iOS)", () => {
  it("uses accept=image/* so Android opens Gallery / Google Photos providers", () => {
    expect(NATIVE_IMAGE_GALLERY_ACCEPT).toBe("image/*");
    expect(NATIVE_IMAGE_FALLBACK_ACCEPT).toBe("image/*");
    expect(resolveNativeImageAccept("gallery")).toBe("image/*");
    expect(resolveNativeImageAccept("any")).toBe("image/*");
  });

  it("documents supported image MIME types without forcing them into accept", () => {
    expect(NATIVE_IMAGE_SUPPORTED_MIME).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ]);
  });

  it("never forces capture on gallery intent; camera intent uses environment", () => {
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(resolveNativeImageCapture("any")).toBeUndefined();
    expect(resolveNativeImageCapture("camera")).toBe("environment");
  });

  it("has exactly one file-input photo picker implementation in features/sell", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const files = walkTsFiles(sellRoot);
    const fileInputOwners = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return /type=["']file["']/.test(source);
    });

    const relative = fileInputOwners.map((file) =>
      path.relative(process.cwd(), file).replace(/\\/g, "/"),
    );

    expect(relative).toEqual(["features/sell/ui/SellPhotoFileInput.tsx"]);
    expect(existsSync(path.join(sellRoot, "ui/SellPhotoFileInput.tsx"))).toBe(true);
  });

  it("bans legacy / duplicate picker names inside the sell module", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const bannedPatterns = [
      /\bNativeImageFileInput\b/,
      /\bPhotoUploader\b/,
      /\bUniversalPhotoPickerSheet\b/,
      /\bImagePicker\b/,
      /\bFilePicker\b/,
      /\bGalleryPicker\b/,
      /\bCameraPicker\b/,
      /\bsourceSheetOpen\b/,
      /\bActionSheet\b/,
      /\bBottomSheet\b/,
    ];

    for (const file of walkTsFiles(sellRoot)) {
      const source = readFileSync(file, "utf8");
      const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");
      for (const pattern of bannedPatterns) {
        expect(pattern.test(source), `${relative} must not match ${pattern}`).toBe(false);
      }
    }
  });

  it("single-select picker auto-returns — Apply only for multi", () => {
    const picker = readSource("features/sell/ui/SellOptionPicker.tsx");
    expect(picker).toContain("selectSingle");
    expect(picker).toContain("onDone([id])");
    expect(picker).toContain("applyMulti");
    expect(picker).toMatch(/mode === "multiple" \? \([\s\S]*Apply[\s\S]*\) : null/);
  });

  it("sell Add Photos: one Add Photo card → compact Camera/Gallery choice → native inputs", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");

    expect(rail).toContain("SellPhotoFileInput");
    expect(rail).toContain("GalleryLineIcon");
    expect(rail).toContain("CameraLineIcon");
    expect(rail).toContain("Add Photo");
    expect(rail).toContain('data-sell-add-photo="v1"');
    expect(rail).toContain('data-sell-photo-source-choice="v1"');
    expect(rail).toContain('intent="gallery"');
    expect(rail).toContain('intent="camera"');
    expect(rail).toContain("Take Photo");
    expect(rail).toContain("Choose from Gallery");
    expect(rail).toContain('data-native-photo-picker-host="v1.0"');
    expect(rail).toContain('data-native-photo-picker-trigger="add"');
    expect(rail).toContain('data-native-photo-picker-trigger="camera"');
    expect(rail).toContain('data-native-photo-picker-trigger="gallery"');
    expect(rail).not.toMatch(/\bTake Photos\b/);
    expect(rail).not.toContain("SellCameraMultiPhotoSession");
    expect(rail).not.toContain("UniversalPhotoPickerSheet");
    expect(rail).not.toContain("ComposeLineIcon");
    expect(rail).not.toContain("NativeImageFileInput");
    expect(rail).not.toContain("ActionSheet");
    expect(rail).not.toContain("BottomSheet");

    expect(input).toContain('type="file"');
    expect(input).toContain("resolveNativeImageAccept");
    expect(input).toContain("resolveNativeImageCapture");
    expect(input).toContain("data-universal-photo-intent={intent}");
    expect(input).toContain("data-native-photo-picker");
    expect(input).toContain("data-sell-photo-multiple");
    expect(input).toContain("...(capture ? { capture } : {})");
    expect(input).toContain('intent === "camera" ? false : Boolean(multiple)');
  });

  it("camera capture=environment · gallery omits capture (Android + iOS contract)", () => {
    const input = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(input).toContain("resolveNativeImageCapture(intent)");
    expect(resolveNativeImageCapture("gallery")).toBeUndefined();
    expect(resolveNativeImageCapture("camera")).toBe("environment");
    expect(NATIVE_PHOTO_PICKER_V1.cameraCapture).toBe("environment");
  });

  it("Add Photo shares SELL_PHOTO_MAX=10 via addPhotos", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(rail).toContain("handleFilesSelected");
    expect(rail).toContain("void addPhotos(files)");
    expect(rail).toContain('intent="gallery"');
    expect(rail).toContain('intent="camera"');
    expect(provider).toContain("capSellPhotoSelection");
    expect(provider).toContain(".slice(0, SELL_PHOTO_MAX)");
    expect(SELL_PHOTO_MAX).toBe(10);
  });

  it("reuses single SellPhotoFileInput — no duplicate uploader", () => {
    const sellRoot = path.join(process.cwd(), "features/sell");
    const files = walkTsFiles(sellRoot);
    const fileInputOwners = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return /type=["']file["']/.test(source);
    });
    const relative = fileInputOwners.map((file) =>
      path.relative(process.cwd(), file).replace(/\\/g, "/"),
    );
    expect(relative).toEqual(["features/sell/ui/SellPhotoFileInput.tsx"]);
  });

  it("shared NativeImageFileInput omits capture unless camera intent", () => {
    const source = readSource("components/ui/NativeImageFileInput.tsx");
    expect(source).toContain('type="file"');
    expect(source).toContain("...(capture ? { capture } : {})");
    expect(source).not.toContain("aria-hidden");
    expect(source).not.toContain("tabIndex={-1}");
  });

  it("routes auction sell bookmarks to canonical Sell", () => {
    const route = readSource("app/(platform)/sell/auction/page.tsx");
    expect(route).toContain('redirect("/sell")');
    expect(
      existsSync(path.join(process.cwd(), "features/auctions/sell/AuctionSellPage.tsx")),
    ).toBe(false);
  });

  it("overlay input covers the full label hit target", () => {
    expect(nativeImageFileInputOverlayClassName).toContain("inset-0");
    expect(nativeImageFileInputOverlayClassName).toContain("opacity-0");
  });

  it("sanitizes React useId values for htmlFor association", () => {
    expect(sanitizeNativeImagePickerId(":r1:photo")).toBe("r1photo");
  });

  it("enforces maximum listing photos", () => {
    expect(SELL_PHOTO_MAX).toBe(10);
  });
});

describe("sell photo upload state", () => {
  it("resets file input value after selection for re-pick", () => {
    const source = readSource("features/sell/ui/SellPhotoFileInput.tsx");
    expect(source).toContain('event.target.value = ""');
  });

  it("caps added photos at SELL_PHOTO_MAX in provider", () => {
    const source = readSource("features/sell/context/SellProvider.tsx");
    expect(source).toContain("capSellPhotoSelection");
    expect(source).toContain(".slice(0, SELL_PHOTO_MAX)");
  });

  it("auto-uploads after selection and retries only on uploadError", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    expect(provider).toContain("uploadPhoto");
    expect(rail).toContain("addPhotos");
    expect(rail).toContain("photo.uploadError");
    expect(rail).toContain("Retry");
  });
});
