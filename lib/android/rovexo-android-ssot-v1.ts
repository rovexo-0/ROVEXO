/**
 * Canonical consumer Android shell — Trusted Web Activity for www.rovexo.co.uk.
 * Staff Capacitor (`co.uk.rovexo.staff`) remains a separate internal product.
 */

import {
  ROVEXO_ANDROID_VERSION_CODE,
  ROVEXO_ANDROID_VERSION_NAME,
  ROVEXO_APP_VERSION,
} from "@/lib/app/version";

export const ROVEXO_ANDROID_APPLICATION_ID = "com.rovexo.app" as const;
export const ROVEXO_ANDROID_MIN_SDK = 23 as const;
export const ROVEXO_ANDROID_COMPILE_SDK = 36 as const;
export const ROVEXO_ANDROID_TARGET_SDK = 36 as const;
export const ROVEXO_ANDROID_HOST = "www.rovexo.co.uk" as const;
export const ROVEXO_ANDROID_DEFAULT_URL = "https://www.rovexo.co.uk/" as const;
export const ROVEXO_ANDROID_PROJECT = "apps/rovexo-android" as const;

export const ROVEXO_ANDROID_RELEASE = {
  applicationId: ROVEXO_ANDROID_APPLICATION_ID,
  versionName: ROVEXO_ANDROID_VERSION_NAME,
  versionCode: ROVEXO_ANDROID_VERSION_CODE,
  webVersion: ROVEXO_APP_VERSION,
  minSdk: ROVEXO_ANDROID_MIN_SDK,
  compileSdk: ROVEXO_ANDROID_COMPILE_SDK,
  targetSdk: ROVEXO_ANDROID_TARGET_SDK,
  host: ROVEXO_ANDROID_HOST,
  defaultUrl: ROVEXO_ANDROID_DEFAULT_URL,
  project: ROVEXO_ANDROID_PROJECT,
} as const;
