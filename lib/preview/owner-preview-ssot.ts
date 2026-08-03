/**
 * ROVEXO Owner Preview Policy v3.0 (CANONICAL FREEZE · OWNER APPROVED · P0)
 *
 * ONE PROJECT + ONE OFFICIAL OWNER URL + ONE PERMANENT DOMAIN + ALL MODULES.
 * If the Owner cannot open it from their phone, it is not ready for approval.
 */

/** Official Owner testing origin — sole permanent domain for ROVEXO v1.0. */
export const OWNER_PREVIEW_ORIGIN = "https://www.rovexo.co.uk" as const;

/**
 * @deprecated DNS failure — replaced by OWNER_PREVIEW_ORIGIN (Policy v3.0).
 * Never cite as official Owner URL.
 */
export const OWNER_PREVIEW_ORIGIN_DEPRECATED =
  "https://preview.rovexo.co.uk" as const;

/** Cursor / agent local development + certification only. Never for Owner approval. */
export const CURSOR_LOCAL_ORIGIN = "http://localhost:3000" as const;

/**
 * Production origin — same permanent domain as Owner preview (Policy v3.0).
 * Deploy gates still require explicit Owner approval per stage.
 */
export const PRODUCTION_ORIGIN = "https://www.rovexo.co.uk" as const;

/** Legacy Vercel git-branch URL — infra only; never a second Owner URL. */
export const VERCEL_DEVELOP_BRANCH_ORIGIN =
  "https://rovexo-git-develop-rovexo.vercel.app" as const;

export const OWNER_PREVIEW_ROUTES = {
  home: "/",
  login: "/login",
  account: "/account",
  settings: "/account/settings",
  wallet: "/wallet",
  balance: "/wallet",
  transactions: "/wallet/transactions",
  paymentMethods: "/wallet/payment-methods",
  bankAccounts: "/wallet/bank-accounts",
  orders: "/orders",
  checkout: "/checkout",
  sell: "/sell",
  promote: "/promote",
  inbox: "/inbox",
  messages: "/inbox",
  saved: "/saved",
  search: "/search",
  business: "/business",
} as const;

export function ownerPreviewUrl(path: string = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${OWNER_PREVIEW_ORIGIN}${normalized === "/" ? "" : normalized}`;
}

export function cursorLocalUrl(path: string = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CURSOR_LOCAL_ORIGIN}${normalized === "/" ? "" : normalized}`;
}

/** Owner Preview Certification — required before Owner can approve. */
export const OWNER_PREVIEW_CERTIFICATION = {
  name: "ROVEXO OWNER PREVIEW CERTIFICATION" as const,
  version: "v1.0" as const,
  status: "CANONICAL FREEZE · OWNER APPROVED" as const,
  rule: "If the Owner cannot open the URL from their phone, it is not ready for approval.",
  requiredGates: [
    "DNS PASS",
    "HTTPS PASS",
    "PUBLIC ACCESS PASS",
    "MOBILE PASS",
    "IPHONE PASS",
    "ANDROID PASS",
    "RESPONSIVE PASS",
    "CROSS BROWSER CERTIFICATION PASS",
    "NAVIGATION PASS",
    "OWNER ACCESS PASS",
    "OWNER VISUAL APPROVAL",
  ] as const,
  forbiddenAsOfficial: [
    "localhost",
    "localhost:3000",
    "localhost:3010",
    "HTTP only",
    "ERR_INVALID_URL",
    "temporary URLs",
    "multiple preview URLs",
    "daily generated preview links",
    "module specific URLs",
    "screenshots-only approval",
    "desktop-only approval",
  ] as const,
  freezeBlockedUntilOwnerAccess:
    "FREEZE · COMMIT · PUSH · DEPLOY · PRODUCTION CERTIFICATION · PRODUCTION APPROVAL",
} as const;

export const OWNER_PREVIEW_CONTRACT = {
  name: "ROVEXO OWNER PREVIEW POLICY" as const,
  version: "v3.0" as const,
  status: "CANONICAL FREEZE · LOCKED · OWNER APPROVED · P0" as const,
  ownerOrigin: OWNER_PREVIEW_ORIGIN,
  permanentDomain: OWNER_PREVIEW_ORIGIN,
  cursorOrigin: CURSOR_LOCAL_ORIGIN,
  productionOrigin: PRODUCTION_ORIGIN,
  deprecatedOrigin: OWNER_PREVIEW_ORIGIN_DEPRECATED,
  certification: OWNER_PREVIEW_CERTIFICATION,
  goldenRule:
    "ONE PROJECT = ONE OFFICIAL OWNER PREVIEW URL = ONE PERMANENT DOMAIN = ALL MODULES UNDER SAME ORIGIN",
  absoluteRule:
    "If the Owner cannot test it himself, it does not exist for approval purposes.",
  replacementPolicy:
    "Official URL never changes unless DNS failure, permanent infrastructure migration, catastrophic failure, or Owner approval. Old URL deprecated. Never two official URLs.",
  forbidden: [
    "multiple official Owner preview URLs",
    "preview URL per module / sprint / day",
    "localhost links for Owner approval",
    "screenshots-only or video-only Owner approval",
    "desktop-only Owner approval without mobile",
    "temporary or disposable preview links",
    "asking Owner to approve inaccessible pages",
    "replacing official Owner URL without approval",
  ] as const,
} as const;
