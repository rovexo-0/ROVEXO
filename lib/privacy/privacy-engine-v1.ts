/**
 * ROVEXO Privacy Engine v1.0 — controls, profile visibility, cookies, data actions.
 */

import type { ProfileVisibility } from "@/lib/settings/types";
import type { SettingsIconTone } from "@/lib/settings/settings-v1";
import type { SettingsMenuIcon } from "@/lib/account-center/settings-menu";

export const PRIVACY_ENGINE_VERSION = "1.0" as const;
export const PRIVACY_ENGINE_STATUS = "PRODUCTION" as const;

export type PrivacySwitchId =
  | "showOnlineStatus"
  | "showLastSeen"
  | "showFollowers"
  | "showFollowing"
  | "showReviews"
  | "showSoldItems"
  | "showJoinDate"
  | "showVerificationBadge"
  | "allowBuyerMessages"
  | "allowSellerMessages"
  | "allowMessageRequests"
  | "allowOrderMessages"
  | "personalisedHomepage"
  | "personalisedSearch"
  | "aiRecommendations"
  | "similarItems"
  | "recentlyViewedItems"
  | "marketingEmails"
  | "personalisedMarketing"
  | "featureMyListings"
  | "partnerPromotions"
  | "appearInMarketplaceSearch"
  | "recommendedSeller"
  | "trendingSeller"
  | "allowFollowers"
  | "publicFollowerCount"
  | "publicFollowingCount";

export type CookiePreferenceId =
  | "necessary"
  | "functional"
  | "analytics"
  | "performance"
  | "advertising"
  | "personalisation";

export type PrivacyEngineControl = {
  id: PrivacySwitchId | CookiePreferenceId;
  label: string;
  description?: string;
  locked?: boolean;
};

export type PrivacyEngineSection = {
  id: string;
  title: string;
  intro?: string;
  icon: SettingsMenuIcon;
  tone: SettingsIconTone;
  kind: "switches" | "selector";
  controls?: readonly PrivacyEngineControl[];
};

export type PrivacyEngineState = {
  version: typeof PRIVACY_ENGINE_VERSION;
  switches: Record<PrivacySwitchId, boolean>;
  whoCanViewProfile: ProfileVisibility;
};

export type CookiePreferencesState = {
  version: typeof PRIVACY_ENGINE_VERSION;
  necessary: true;
  functional: boolean;
  analytics: boolean;
  performance: boolean;
  advertising: boolean;
  personalisation: boolean;
};

export const PRIVACY_PROFILE_VISIBILITY_OPTIONS = [
  { value: "public" as const, label: "Everyone" },
  { value: "members_only" as const, label: "Members Only" },
  { value: "private" as const, label: "Nobody" },
] as const;

export const PRIVACY_ENGINE_SECTIONS: readonly PrivacyEngineSection[] = [
  {
    id: "privacy-controls",
    title: "Privacy Controls",
    icon: "lock",
    tone: "green",
    kind: "switches",
    controls: [
      { id: "showOnlineStatus", label: "Show Online Status" },
      { id: "showLastSeen", label: "Show Last Seen" },
    ],
  },
  {
    id: "profile-visibility",
    title: "Profile Visibility",
    icon: "people",
    tone: "purple",
    kind: "switches",
    controls: [
      { id: "showFollowers", label: "Show Followers" },
      { id: "showFollowing", label: "Show Following" },
      { id: "showReviews", label: "Show Reviews" },
      { id: "showSoldItems", label: "Show Sold Items" },
      { id: "showJoinDate", label: "Show Join Date" },
      { id: "showVerificationBadge", label: "Show Verification Badge" },
    ],
  },
  {
    id: "who-can-view",
    title: "Who can view my profile",
    icon: "user",
    tone: "blue",
    kind: "selector",
  },
  {
    id: "messaging",
    title: "Messaging Privacy",
    icon: "bell",
    tone: "orange",
    kind: "switches",
    controls: [
      { id: "allowBuyerMessages", label: "Allow Buyer Messages" },
      { id: "allowSellerMessages", label: "Allow Seller Messages" },
      { id: "allowMessageRequests", label: "Allow Message Requests" },
      { id: "allowOrderMessages", label: "Allow Order Messages" },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace Privacy",
    icon: "star",
    tone: "gold",
    kind: "switches",
    controls: [
      { id: "personalisedHomepage", label: "Personalised Homepage" },
      { id: "personalisedSearch", label: "Personalised Search" },
      { id: "aiRecommendations", label: "AI Recommendations" },
      { id: "similarItems", label: "Similar Items" },
      { id: "recentlyViewedItems", label: "Recently Viewed Items" },
    ],
  },
  {
    id: "marketing",
    title: "Marketing Preferences",
    icon: "megaphone",
    tone: "purple",
    kind: "switches",
    controls: [
      { id: "marketingEmails", label: "Marketing Emails" },
      { id: "personalisedMarketing", label: "Personalised Marketing" },
      { id: "featureMyListings", label: "Feature My Listings" },
      { id: "partnerPromotions", label: "Partner Promotions" },
    ],
  },
  {
    id: "search-discovery",
    title: "Search & Discovery",
    icon: "globe",
    tone: "rovexo-blue",
    kind: "switches",
    controls: [
      { id: "appearInMarketplaceSearch", label: "Appear in Marketplace Search" },
      { id: "recommendedSeller", label: "Recommended Seller" },
      { id: "trendingSeller", label: "Trending Seller" },
    ],
  },
      {
    id: "followers-social",
    title: "Followers & Social",
    icon: "people",
    tone: "green",
    kind: "switches",
    controls: [
      { id: "allowFollowers", label: "Allow Followers" },
      { id: "publicFollowerCount", label: "Public Follower Count" },
      { id: "publicFollowingCount", label: "Public Following Count" },
    ],
  },
] as const;

export const COOKIE_PREFERENCE_CONTROLS: readonly PrivacyEngineControl[] = [
  {
    id: "necessary",
    label: "Necessary",
    description: "Required to run ROVEXO — always on.",
    locked: true,
  },
  { id: "functional", label: "Functional", description: "Remember preferences and improve usability." },
  { id: "analytics", label: "Analytics", description: "Help us understand how ROVEXO is used." },
  { id: "performance", label: "Performance", description: "Measure speed and reliability." },
  { id: "advertising", label: "Advertising", description: "Optional advertising measurement." },
  {
    id: "personalisation",
    label: "Personalisation",
    description: "Tailor content based on your activity.",
  },
] as const;

const PRIVACY_SWITCH_IDS: readonly PrivacySwitchId[] = [
  "showOnlineStatus",
  "showLastSeen",
  "showFollowers",
  "showFollowing",
  "showReviews",
  "showSoldItems",
  "showJoinDate",
  "showVerificationBadge",
  "allowBuyerMessages",
  "allowSellerMessages",
  "allowMessageRequests",
  "allowOrderMessages",
  "personalisedHomepage",
  "personalisedSearch",
  "aiRecommendations",
  "similarItems",
  "recentlyViewedItems",
  "marketingEmails",
  "personalisedMarketing",
  "featureMyListings",
  "partnerPromotions",
  "appearInMarketplaceSearch",
  "recommendedSeller",
  "trendingSeller",
  "allowFollowers",
  "publicFollowerCount",
  "publicFollowingCount",
] as const;

export function createDefaultPrivacyEngineState(): PrivacyEngineState {
  const switches = Object.fromEntries(
    PRIVACY_SWITCH_IDS.map((id) => {
      if (id === "marketingEmails" || id === "personalisedMarketing" || id === "partnerPromotions") {
        return [id, false];
      }
      return [id, true];
    }),
  ) as Record<PrivacySwitchId, boolean>;
  return {
    version: PRIVACY_ENGINE_VERSION,
    switches,
    whoCanViewProfile: "public",
  };
}

export function createDefaultCookiePreferences(): CookiePreferencesState {
  return {
    version: PRIVACY_ENGINE_VERSION,
    necessary: true,
    functional: true,
    analytics: false,
    performance: false,
    advertising: false,
    personalisation: false,
  };
}

export function parsePrivacyEngineState(raw: unknown): PrivacyEngineState {
  const defaults = createDefaultPrivacyEngineState();
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Partial<PrivacyEngineState> & {
    switches?: Partial<Record<PrivacySwitchId, boolean>>;
    whoCanViewProfile?: string;
  };
  const switches = { ...defaults.switches };
  if (obj.switches && typeof obj.switches === "object") {
    for (const id of PRIVACY_SWITCH_IDS) {
      if (typeof obj.switches[id] === "boolean") switches[id] = obj.switches[id]!;
    }
  }
  let whoCanViewProfile = defaults.whoCanViewProfile;
  if (
    obj.whoCanViewProfile === "public" ||
    obj.whoCanViewProfile === "members_only" ||
    obj.whoCanViewProfile === "private"
  ) {
    whoCanViewProfile = obj.whoCanViewProfile;
  }
  return { version: PRIVACY_ENGINE_VERSION, switches, whoCanViewProfile };
}

export function parseCookiePreferences(raw: unknown): CookiePreferencesState {
  const defaults = createDefaultCookiePreferences();
  if (!raw || typeof raw !== "object") return defaults;
  const obj = raw as Partial<CookiePreferencesState>;
  return {
    version: PRIVACY_ENGINE_VERSION,
    necessary: true,
    functional: typeof obj.functional === "boolean" ? obj.functional : defaults.functional,
    analytics: typeof obj.analytics === "boolean" ? obj.analytics : defaults.analytics,
    performance: typeof obj.performance === "boolean" ? obj.performance : defaults.performance,
    advertising: typeof obj.advertising === "boolean" ? obj.advertising : defaults.advertising,
    personalisation:
      typeof obj.personalisation === "boolean" ? obj.personalisation : defaults.personalisation,
  };
}

export function applyPrivacySwitchPatch(
  current: PrivacyEngineState,
  id: PrivacySwitchId,
  enabled: boolean,
): PrivacyEngineState {
  const next = parsePrivacyEngineState(current);
  next.switches[id] = enabled === true;
  return next;
}

export function hydratePrivacyFromLegacy(input: {
  profileVisibility?: ProfileVisibility;
  marketingEmails?: boolean;
  showActivityStatus?: boolean;
}): PrivacyEngineState {
  const state = createDefaultPrivacyEngineState();
  if (input.profileVisibility) state.whoCanViewProfile = input.profileVisibility;
  if (typeof input.marketingEmails === "boolean") {
    state.switches.marketingEmails = input.marketingEmails;
  }
  if (typeof input.showActivityStatus === "boolean") {
    state.switches.showOnlineStatus = input.showActivityStatus;
    state.switches.showLastSeen = input.showActivityStatus;
  }
  return state;
}

/** Legacy columns kept in sync for existing readers. */
export function privacyEngineToLegacy(state: PrivacyEngineState): {
  profileVisibility: ProfileVisibility;
  marketingEmails: boolean;
  showActivityStatus: boolean;
} {
  return {
    profileVisibility: state.whoCanViewProfile,
    marketingEmails: state.switches.marketingEmails === true,
    showActivityStatus:
      state.switches.showOnlineStatus === true || state.switches.showLastSeen === true,
  };
}

export function cookiePreferencesToBannerChoice(
  prefs: CookiePreferencesState,
): "accepted" | "rejected" {
  return prefs.analytics === true || prefs.advertising === true || prefs.personalisation === true
    ? "accepted"
    : "rejected";
}

export function isPrivacySwitchId(id: string): id is PrivacySwitchId {
  return (PRIVACY_SWITCH_IDS as readonly string[]).includes(id);
}

export function isCookiePreferenceId(id: string): id is CookiePreferenceId {
  return (
    id === "necessary" ||
    id === "functional" ||
    id === "analytics" ||
    id === "performance" ||
    id === "advertising" ||
    id === "personalisation"
  );
}
