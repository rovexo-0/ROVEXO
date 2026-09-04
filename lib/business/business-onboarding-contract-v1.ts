/**
 * Client-safe Business onboarding contract.
 * Schema, types, and routing helpers only — no Stripe, Supabase, or persistence.
 * Persistence remains in `business-onboarding-v1.ts`.
 */

import { z } from "zod";
import { UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { findCountryByName, validatePostcodeForCountry } from "@/lib/account/countries";
import type { SellerContext } from "@/lib/seller-context/seller-context-v1";

export const BUSINESS_ONBOARDING_ENGINE = "business-onboarding-v1" as const;

export const BUSINESS_TYPE_OPTIONS = [
  {
    id: "business_sole_trader" as const,
    label: "Sole trader",
  },
  {
    id: "business_company" as const,
    label: "Limited company",
  },
] as const;

export type BusinessRegistrationType = (typeof BUSINESS_TYPE_OPTIONS)[number]["id"];

export type BusinessStripeState =
  | "not_started"
  | "pending"
  | "action_required"
  | "verified";

export type BusinessOnboardingStep = "information" | "stripe" | "active" | "home";

export type BusinessConnectSurface = "native" | "pwa";

export type BusinessStripeStatus = {
  state: BusinessStripeState;
  verified: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  accountIdPresent: boolean;
  currentlyDueCount: number;
  eventuallyDueCount: number;
  disabledReason: string | null;
};

export type BusinessProfilePayload = {
  businessName: string;
  contactEmail: string;
  businessType: BusinessRegistrationType;
  addressLine: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  vatNumber: string | null;
};

export type BusinessStatusSnapshot = {
  engine: typeof BUSINESS_ONBOARDING_ENGINE;
  activeSellerContext: SellerContext;
  hasBusinessProfile: boolean;
  profile: BusinessProfilePayload | null;
  stripe: BusinessStripeStatus;
  nextStep: BusinessOnboardingStep;
  identity: {
    businessName: string | null;
    avatarUrl: string | null;
    username: string | null;
    verified: boolean;
    rating: number;
    reviewCount: number;
    positivePercent: number;
    soldCount: number;
  };
  wallet: {
    availableBalance: number;
    pendingBalance: number;
  } | null;
};

const businessTypeSchema = z.enum(["business_sole_trader", "business_company"]);

export const businessInformationSchema = z
  .object({
    businessName: z.string().trim().min(1, "Business or trading name is required").max(100),
    contactEmail: z.string().trim().email("Enter a valid contact email").max(120),
    businessType: businessTypeSchema,
    addressLine: z.string().trim().min(1, "Business address is required").max(120),
    addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().min(1, "City is required").max(80),
    postcode: z.string().trim().min(1, "Postcode is required").max(20),
    country: z
      .string()
      .trim()
      .min(1)
      .refine((value) => Boolean(findCountryByName(value)), "Select a supported country")
      .default(UK_DEFAULT_COUNTRY),
    vatNumber: z.string().trim().max(20).optional().or(z.literal("")),
  })
  .refine((data) => validatePostcodeForCountry(data.country, data.postcode), {
    message: "Enter a valid postcode for the selected country",
    path: ["postcode"],
  });

export type BusinessInformationInput = z.infer<typeof businessInformationSchema>;

export function isBusinessRegistrationType(value: unknown): value is BusinessRegistrationType {
  return value === "business_sole_trader" || value === "business_company";
}

export function deriveBusinessStripeState(input: {
  accountIdPresent: boolean;
  connected: boolean;
  payoutsEnabled: boolean;
  currentlyDueCount: number;
}): BusinessStripeState {
  if (!input.accountIdPresent) return "not_started";
  if (input.connected && input.payoutsEnabled) return "verified";
  if (input.currentlyDueCount > 0 || (!input.connected && input.accountIdPresent)) {
    return "action_required";
  }
  return "pending";
}

export function isStripeBusinessVerified(state: BusinessStripeState): boolean {
  return state === "verified";
}

export function resolveBusinessNextStep(input: {
  hasBusinessProfile: boolean;
  stripeState: BusinessStripeState;
}): BusinessOnboardingStep {
  if (!input.hasBusinessProfile) return "information";
  if (input.stripeState !== "verified") return "stripe";
  return "home";
}

export function businessOnboardingHref(nextStep: BusinessOnboardingStep): string {
  switch (nextStep) {
    case "information":
      return "/business/information";
    case "stripe":
      return "/business/connect";
    case "active":
      return "/business/active";
    case "home":
      return "/business/dashboard";
  }
}

export function accountBusinessEntryHref(
  status: Pick<BusinessStatusSnapshot, "hasBusinessProfile" | "stripe"> | null | undefined,
): string {
  if (!status) return "/business/information";
  if (status.stripe.verified) return "/business/dashboard";
  if (status.hasBusinessProfile) return "/business/connect";
  return "/business/information";
}

/**
 * Business is complete only when the canonical onboarding chain is finished:
 * saved Business profile AND Stripe Connect verified.
 * Partial fields or an in-progress Connect session are not enough.
 */
export function isBusinessOnboardingComplete(
  status: Pick<BusinessStatusSnapshot, "hasBusinessProfile" | "stripe"> | null | undefined,
): boolean {
  if (!status?.hasBusinessProfile || !status.stripe.verified) return false;
  return (
    resolveBusinessNextStep({
      hasBusinessProfile: status.hasBusinessProfile,
      stripeState: status.stripe.state,
    }) === "home"
  );
}

export const PROFILE_BUSINESS_ACTION = {
  upgrade: {
    kind: "upgrade",
    emoji: "🚀",
    title: "Upgrade to Business",
  },
  switchToBusiness: {
    kind: "switch-to-business",
    emoji: "🔄",
    title: "Switch to Business",
  },
  switchToIndividual: {
    kind: "switch-to-individual",
    emoji: "👤",
    title: "Switch to Individual",
  },
} as const;

export type ProfileBusinessActionKind = (typeof PROFILE_BUSINESS_ACTION)[keyof typeof PROFILE_BUSINESS_ACTION]["kind"];

export type ProfileBusinessAction = (typeof PROFILE_BUSINESS_ACTION)[keyof typeof PROFILE_BUSINESS_ACTION];

export type ProfileBusinessStatusInput = Pick<
  BusinessStatusSnapshot,
  "hasBusinessProfile" | "stripe" | "activeSellerContext"
>;

export function resolveProfileBusinessAction(
  status: ProfileBusinessStatusInput | null | undefined,
): ProfileBusinessAction {
  if (!isBusinessOnboardingComplete(status)) {
    return PROFILE_BUSINESS_ACTION.upgrade;
  }
  if (status?.activeSellerContext === "business") {
    return PROFILE_BUSINESS_ACTION.switchToIndividual;
  }
  return PROFILE_BUSINESS_ACTION.switchToBusiness;
}
