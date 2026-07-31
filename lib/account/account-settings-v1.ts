/**
 * ROVEXO PERSONAL INFORMATION v1.0 (PERMANENT LOCK · APPROVED)
 *
 * PROFILE PAGE = VISUAL MASTER → PERSONAL INFORMATION inherits 100%.
 * ONLY CONTENT MAY DIFFER. DESIGN NEVER DOES.
 *
 * Route: /account/profile · Shell: MyAccountTemplate
 * Save Engine v2.0 — automatic save, no Save/Apply/Update/Cancel buttons.
 */

import type { AccountCapabilities } from "@/lib/profile/unified-account";
import {
  SAVE_ENGINE_ANIM_MS,
  SAVE_ENGINE_COPY,
  SAVE_ENGINE_SUCCESS_MS,
} from "@/lib/account/save-engine-v2";

export const ACCOUNT_SETTINGS_ENGINE_NAME = "ROVEXO PERSONAL INFORMATION" as const;
export const ACCOUNT_SETTINGS_STATUS =
  "PERMANENT LOCK · UI/UX APPROVED · FULL WIDTH · MOBILE FIRST · PRODUCTION READY" as const;
export const ACCOUNT_SETTINGS_VERSION = "1.0" as const;
/** DOM kept for Full Width CSS targeting (engine stylesheet). */
export const ACCOUNT_SETTINGS_DOM = "v1.5" as const;
export const ACCOUNT_SETTINGS_ROUTE = "/account/profile" as const;
export const ACCOUNT_SETTINGS_UI_LOCK = true as const;

export const PERSONAL_INFORMATION_V1_NAME = "ROVEXO PERSONAL INFORMATION" as const;
export const PERSONAL_INFORMATION_V1_VERSION = "1.0" as const;
export const PERSONAL_INFORMATION_V1_STATUS = ACCOUNT_SETTINGS_STATUS;

/** Locked field inventory — content only. */
export const ACCOUNT_SETTINGS_LAYOUT = [
  "Profile Photo",
  "Full Name",
  "Username",
  "Email Address",
  "Phone Number",
  "Date of Birth",
  "Gender (Optional)",
  "Country",
] as const;

export const PERSONAL_INFORMATION_V1_ROWS = [
  { title: "Profile Photo", subtitle: "Add or change your profile photo." },
  { title: "Full Name", subtitle: "Your legal name." },
  { title: "Username", subtitle: "Your public username." },
  { title: "Email Address", subtitle: "Verified email address." },
  { title: "Phone Number", subtitle: "Add or change your phone number." },
  { title: "Date of Birth", subtitle: "DD / MM / YYYY." },
  { title: "Gender (Optional)", subtitle: "Optional information." },
  { title: "Country", subtitle: "United Kingdom." },
] as const;

/** Permanently removed from Personal Information (canonical homes elsewhere). */
export const PERSONAL_INFORMATION_V1_REMOVED = [
  "Currency",
  "Account Type",
  "Wallet",
  "Balance",
  "Payment Methods",
  "ROVEXO Verified",
  "Google",
  "Apple",
  "Facebook",
  "Connected Accounts",
  "2 Factor Authentication",
  "Password",
  "Devices",
  "Sessions",
  "Notifications",
  "Business Information",
] as const;

export const PERSONAL_INFORMATION_V1_CANONICAL_HOMES = {
  Currency: "SETTINGS",
  Wallet: "BALANCE",
  "Payment Methods": "BALANCE",
  "ROVEXO VERIFIED": "VERIFICATION",
  Password: "SECURITY",
  "2FA": "SECURITY",
  Devices: "SECURITY",
  "Google / Apple / Facebook": "CONNECTED ACCOUNTS",
  "Business Information": "BUSINESS VERIFICATION",
} as const;

export const PERSONAL_INFORMATION_V1_MASTER = {
  profileIsVisualMaster: true,
  inheritsMyAccountTemplate: true,
  inheritsFullWidth: true,
  inheritsIconFamily: true,
  inheritsColorSystem: true,
  inheritsTypography: true,
  inheritsComponents: true,
  inheritsProfileMasterTokens: true,
  oneDesignSystem: true,
  onlyContentMayDiffer: true,
  designNeverDoes: true,
  mustBeProfileNotSimilar: true,
  visualScoreTarget: 9.9,
  oneChangeRule: true,
  /** Forbidden: inventing px not present on Profile. */
  forbiddenGuessedPx: true,
} as const;

export const ACCOUNT_SETTINGS_SPACING = {
  padLeftPx: 16,
  padRightPx: 16,
  padTopPx: 24,
  padBottomPx: 24,
  rowMinHeightPx: 56,
  sectionGapPx: 24,
  saveGapAbovePx: 0,
  saveGapBelowPx: 0,
  saveHeightPx: 0,
  saveWidthPercent: 0,
  saveRadiusPx: 0,
  saveAnimMs: SAVE_ENGINE_ANIM_MS,
  separatorColor: "transparent",
} as const;

export const ACCOUNT_SETTINGS_TYPE = {
  fieldTitlePx: 16,
  fieldTitleWeight: 400,
  fieldValuePx: 14,
  fieldValueWeight: 400,
} as const;

export const ACCOUNT_SETTINGS_FULL_NAME_MAX = 50 as const;
export const ACCOUNT_SETTINGS_USERNAME_MIN = 3 as const;
export const ACCOUNT_SETTINGS_USERNAME_MAX = 30 as const;
export const ACCOUNT_SETTINGS_PHOTO_SIZE_PX = 64 as const;
export const ACCOUNT_SETTINGS_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const ACCOUNT_SETTINGS_PHOTO_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const ACCOUNT_SETTINGS_SAVE_HEIGHT_PX = 0 as const;
export const ACCOUNT_SETTINGS_MIN_AGE = 18 as const;
export const ACCOUNT_SETTINGS_SAVE_SUCCESS_MS = SAVE_ENGINE_SUCCESS_MS;
export const ACCOUNT_SETTINGS_SAVE_ANIM_MS = SAVE_ENGINE_ANIM_MS;
export const ACCOUNT_SETTINGS_SAVE_SUCCESS_COPY = SAVE_ENGINE_COPY.success;
export const ACCOUNT_SETTINGS_SAVING_COPY = SAVE_ENGINE_COPY.saving;
export const ACCOUNT_SETTINGS_USERNAME_UNAVAILABLE = "Username unavailable." as const;
export const ACCOUNT_SETTINGS_FAIL_CLOSED_COPY =
  "Some information is temporarily unavailable. Please try again shortly." as const;

export const ACCOUNT_SETTINGS_COUNTRY_V1 = "United Kingdom" as const;
export const ACCOUNT_SETTINGS_LANGUAGE_V1 = "English (UK)" as const;
export const ACCOUNT_SETTINGS_LOCALE_V1 = "en-GB" as const;
export const ACCOUNT_SETTINGS_CURRENCY_ACTIVE = "GBP (£)" as const;

export const ACCOUNT_SETTINGS_CURRENCIES = [
  { code: "GBP (£)", label: "GBP (£)", active: true },
  { code: "EUR (€)", label: "EUR", active: false },
  { code: "USD ($)", label: "USD", active: false },
] as const;

export const ACCOUNT_SETTINGS_GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not", label: "Prefer not to say" },
] as const;

export const ACCOUNT_SETTINGS_VERIFIED_COLORS = {
  Verified: "#047857",
  "Pending Verification": "#D97706",
  "Not Verified": "#DC2626",
} as const;

export const ACCOUNT_SETTINGS_FORBIDDEN = [
  "cards",
  "borders",
  "shadows",
  "boxes",
  "containers",
  "nested-pages",
  "popups",
  "modals",
  "inline-connect-buttons",
  "double-save",
  "always-visible-save",
  "reserved-save-space",
  "confirmation-pages",
  "scroll-jump",
  "page-reload-on-save",
  ...PERSONAL_INFORMATION_V1_REMOVED,
] as const;

export type AccountSettingsTypeLabel = "Buyer" | "Individual Seller" | "Business Seller";

export type RovexoVerificationUiStatus = "Verified" | "Pending Verification" | "Not Verified";

export type RovexoVerificationDisplay = {
  status: RovexoVerificationUiStatus;
};

/** Form snapshot — personal fields only (currency locked GBP for settings API, not UI). */
export type AccountSettingsFormSnapshot = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
};

/** Read-only account type from unified capabilities — never shown on Personal Information. */
export function resolveAccountSettingsTypeLabel(
  capabilities: Pick<AccountCapabilities, "hasBusinessVerification" | "hasSellingActivity">,
): AccountSettingsTypeLabel {
  if (capabilities.hasBusinessVerification) return "Business Seller";
  if (capabilities.hasSellingActivity) return "Individual Seller";
  return "Buyer";
}

export function resolveRovexoVerificationDisplay(input: {
  verified: boolean;
  pendingReview?: boolean;
}): RovexoVerificationDisplay {
  if (input.pendingReview) return { status: "Pending Verification" };
  if (input.verified) return { status: "Verified" };
  return { status: "Not Verified" };
}

/** Display mask: mih****@gmail.com */
export function maskEmailAddress(email: string | null | undefined): string {
  const raw = email?.trim() ?? "";
  if (!raw) return "Verified email address.";
  const at = raw.indexOf("@");
  if (at <= 0) return raw;
  const local = raw.slice(0, at);
  const domain = raw.slice(at);
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}****${domain}`;
}

/** Display mask: +44*******83 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  const raw = phone?.trim() ?? "";
  if (!raw) return "Add or change your phone number.";
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.length < 6) return raw;
  const prefix = digits.startsWith("+") ? digits.slice(0, 3) : digits.slice(0, 2);
  const suffix = digits.slice(-2);
  const stars = "*".repeat(Math.max(5, digits.length - prefix.length - 2));
  return `${prefix}${stars}${suffix}`;
}

/** Parse DD/MM/YYYY → Date or null. */
export function parseDobDdMmYyyy(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Display: 22 January 1988 */
export function formatDobDisplay(value: string): string {
  const parsed = parseDobDdMmYyyy(value) ?? parseDobIso(value);
  if (!parsed) return value.trim() || "DD / MM / YYYY.";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

/** Parse ISO YYYY-MM-DD → Date or null. */
export function parseDobIso(value: string | null | undefined): Date | null {
  const raw = (value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [y, m, d] = raw.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** DD/MM/YYYY → YYYY-MM-DD or null. */
export function dobDdMmYyyyToIso(value: string): string | null {
  const parsed = parseDobDdMmYyyy(value);
  if (!parsed) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → DD/MM/YYYY or "". */
export function dobIsoToDdMmYyyy(value: string | null | undefined): string {
  const parsed = parseDobIso(value);
  if (!parsed) return "";
  const d = String(parsed.getDate()).padStart(2, "0");
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const y = parsed.getFullYear();
  return `${d}/${m}/${y}`;
}

export function isAtLeastAge(dob: Date, minAge: number = ACCOUNT_SETTINGS_MIN_AGE): boolean {
  const today = new Date();
  const age =
    today.getFullYear() -
    dob.getFullYear() -
    (today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      ? 1
      : 0);
  return age >= minAge;
}

export function formatUsernameDisplay(username: string): string {
  const clean = username.trim().replace(/^@+/, "").toLowerCase();
  return clean ? `@${clean}` : "";
}

export function isAccountSettingsPhotoFileValid(file: File): boolean {
  if (file.size > ACCOUNT_SETTINGS_PHOTO_MAX_BYTES) return false;
  const mime = file.type.toLowerCase();
  if ((ACCOUNT_SETTINGS_PHOTO_MIME as readonly string[]).includes(mime)) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name);
}

/** Save Engine v3 — dirty when any personal field differs from baseline. */
export function isAccountSettingsFormDirty(
  current: AccountSettingsFormSnapshot,
  baseline: AccountSettingsFormSnapshot,
): boolean {
  return (
    current.fullName.trim() !== baseline.fullName.trim() ||
    current.username.trim().toLowerCase().replace(/^@+/, "") !==
      baseline.username.trim().toLowerCase().replace(/^@+/, "") ||
    current.email.trim().toLowerCase() !== baseline.email.trim().toLowerCase() ||
    current.phone.trim() !== baseline.phone.trim() ||
    current.dob.trim() !== baseline.dob.trim() ||
    current.gender !== baseline.gender
  );
}

/** Save Engine v2 — toast status only; no reserved SAVE button. */
export function isAccountSettingsSaveVisible(input: {
  dirty?: boolean;
  saving: boolean;
  successVisible: boolean;
  exiting?: boolean;
  errorVisible?: boolean;
}): boolean {
  return (
    input.saving ||
    input.successVisible ||
    Boolean(input.exiting) ||
    Boolean(input.errorVisible)
  );
}

export type ConnectedAccountRowModel = {
  id: "google" | "apple" | "facebook";
  label: string;
  connected: boolean;
};

/** Connected Accounts helpers — live under Security / Connected Accounts, not Personal Information. */
export function resolveConnectedAccountsView(accounts: ConnectedAccountRowModel[]): {
  empty: boolean;
  rows: Array<{ id: string; title: string; value?: string; connected: boolean }>;
} {
  const empty = accounts.every((item) => !item.connected);
  return {
    empty,
    rows: accounts.map((item) =>
      item.connected
        ? { id: item.id, title: item.label, value: "Connected", connected: true }
        : { id: item.id, title: `Connect ${item.label}`, connected: false },
    ),
  };
}

export function accountSettingsExtrasStorageKey(username: string): string {
  const clean = username.trim().toLowerCase().replace(/^@+/, "") || "member";
  return `rovexo.account-settings.extras.v1.${clean}`;
}

export function getAccountSettingsEngineSnapshot() {
  return {
    name: ACCOUNT_SETTINGS_ENGINE_NAME,
    version: ACCOUNT_SETTINGS_VERSION,
    status: ACCOUNT_SETTINGS_STATUS,
    uiLock: ACCOUNT_SETTINGS_UI_LOCK,
    route: ACCOUNT_SETTINGS_ROUTE,
    spacing: ACCOUNT_SETTINGS_SPACING,
    typography: ACCOUNT_SETTINGS_TYPE,
    layout: ACCOUNT_SETTINGS_LAYOUT,
    forbidden: ACCOUNT_SETTINGS_FORBIDDEN,
    removed: [...PERSONAL_INFORMATION_V1_REMOVED],
    master: PERSONAL_INFORMATION_V1_MASTER,
    onePage: true,
    oneForm: true,
    oneSaveButton: false,
    saveEngine: "v2.0-automatic",
    zeroSaveButtons: true,
    noReservedSaveSpace: true,
    connectedAccountsOnPersonalInfo: false,
    currencyOnPersonalInfo: false,
    inlineEditing: true,
    noScrollJump: true,
    changePhotoMenu: true,
    masterSourceOfTruth: true,
    languageRemoved: true,
    platformLanguage: "en-GB",
  } as const;
}
