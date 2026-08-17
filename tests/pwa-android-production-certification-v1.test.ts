import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROVEXO_ANDROID_APPLICATION_ID,
  ROVEXO_ANDROID_COMPILE_SDK,
  ROVEXO_ANDROID_MIN_SDK,
  ROVEXO_ANDROID_TARGET_SDK,
} from "@/lib/android/rovexo-android-ssot-v1";
import {
  ROVEXO_ANDROID_VERSION_CODE,
  ROVEXO_APP_VERSION,
  ROVEXO_SW_CACHE_NAME,
  ROVEXO_SW_IMAGES_CACHE_NAME,
  ROVEXO_SW_RUNTIME_CACHE_NAME,
} from "@/lib/app/version";
import { ROVEXO_PWA_ID } from "@/lib/pwa/pwa-update-engine-v1";
import {
  isUnsafePwaReloadPath,
  scheduleDeferredSafeServiceWorkerReload,
  shouldReloadForServiceWorkerUpdate,
} from "@/lib/pwa/pwa-update-engine-v1";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("PWA + Android production certification v1", () => {
  it("keeps ONE manifest SSOT with stable id and install icons", () => {
    const manifest = read("app/manifest.ts");
    expect(manifest).toContain("ROVEXO_PWA_ID");
    expect(ROVEXO_PWA_ID).toBe("https://www.rovexo.co.uk/");
    expect(manifest).toContain('start_url: "/"');
    expect(manifest).toContain('scope: "/"');
    expect(manifest).toContain("icon-maskable-512.png");
    expect(manifest).not.toContain("getAppUrl");
    expect(manifest).not.toContain("portrait-primary");
    expect(manifest).not.toContain("2048x2048");
  });

  it("versions service-worker caches and never precaches HTML /", () => {
    const sw = read("public/sw.js");
    expect(sw).toContain(ROVEXO_SW_CACHE_NAME);
    expect(sw).toContain(ROVEXO_SW_RUNTIME_CACHE_NAME);
    expect(sw).toContain(ROVEXO_SW_IMAGES_CACHE_NAME);
    expect(sw).toContain('const PRECACHE_URLS = [');
    expect(sw).not.toMatch(/PRECACHE_URLS = \[[^\]]*["']\/["']/);
    expect(sw).toContain("isNextStaticAsset");
    expect(sw).toContain("isApiPath");
    expect(sw).toContain("ROVEXO_SKIP_WAITING");
    expect(sw).toContain('fetch(request, { cache: "no-store" })');
  });

  it("does not force-reload during checkout, sell, auth, or offer flows", () => {
    expect(isUnsafePwaReloadPath("/checkout")).toBe(true);
    expect(isUnsafePwaReloadPath("/sell")).toBe(true);
    expect(isUnsafePwaReloadPath("/login")).toBe(true);
    expect(isUnsafePwaReloadPath("/inbox/conversation/abc")).toBe(true);
    expect(isUnsafePwaReloadPath("/orders/abc")).toBe(true);
    expect(isUnsafePwaReloadPath("/")).toBe(false);
    expect(isUnsafePwaReloadPath("/search")).toBe(false);
    expect(
      shouldReloadForServiceWorkerUpdate({
        pathname: "/",
        nextVersion: "rovexo-static-v17",
        alreadyReloadedForVersion: "rovexo-static-v17",
        isFormActive: false,
      }),
    ).toBe(false);
    expect(
      shouldReloadForServiceWorkerUpdate({
        pathname: "/checkout",
        nextVersion: "rovexo-static-v17",
        alreadyReloadedForVersion: null,
        isFormActive: false,
      }),
    ).toBe(false);
    expect(typeof scheduleDeferredSafeServiceWorkerReload).toBe("function");
    const pwa = read("components/pwa/PwaProvider.tsx");
    expect(pwa).toContain("scheduleDeferredSafeServiceWorkerReload");
    expect(pwa).toContain('addEventListener("controllerchange"');
  });

  it("locks canonical consumer Android to API 36", () => {
    expect(ROVEXO_ANDROID_APPLICATION_ID).toBe("com.rovexo.app");
    expect(ROVEXO_ANDROID_MIN_SDK).toBe(23);
    expect(ROVEXO_ANDROID_COMPILE_SDK).toBe(36);
    expect(ROVEXO_ANDROID_TARGET_SDK).toBe(36);
    const gradle = read("apps/rovexo-android/app/build.gradle");
    expect(gradle).toContain('applicationId "com.rovexo.app"');
    expect(gradle).toContain("compileSdk 36");
    expect(gradle).toContain("targetSdk 36");
    expect(gradle).toContain(`versionName "${ROVEXO_APP_VERSION}"`);
    expect(gradle).toContain(`versionCode ${ROVEXO_ANDROID_VERSION_CODE}`);
    expect(existsSync("apps/rovexo-android/app/src/main/AndroidManifest.xml")).toBe(true);
    const manifest = read("apps/rovexo-android/app/src/main/AndroidManifest.xml");
    expect(manifest).toContain("android.permission.INTERNET");
    expect(manifest).not.toContain("WRITE_EXTERNAL_STORAGE");
    expect(manifest).not.toContain("READ_EXTERNAL_STORAGE");
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
  });

  it("modernizes the existing staff Capacitor target to API 36", () => {
    const variables = read("apps/rovexo-staff/android/variables.gradle");
    expect(variables).toContain("compileSdkVersion = 36");
    expect(variables).toContain("targetSdkVersion = 36");
    expect(variables).toContain("minSdkVersion = 23");
  });
});
