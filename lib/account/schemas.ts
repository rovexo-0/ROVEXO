import { z } from "zod";
import { BUYER_REGIONS, findCountryByName, validatePostcodeForCountry } from "@/lib/account/countries";
import { SUPPORTED_LOCALE_CODES } from "@/lib/i18n/config";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only");

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name must be at most 80 characters");

export const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone number is too long")
  .regex(/^[+\d\s()-]*$/, "Enter a valid phone number")
  .optional();

export const profileUpdateSchema = z.object({
  fullName: fullNameSchema.optional(),
  username: usernameSchema.optional(),
  phone: phoneSchema,
  bio: z.string().trim().max(500, "Bio must be at most 500 characters").optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const addressTypeSchema = z.enum(["shipping", "billing"]);

export const addressInputSchema = z
  .object({
    recipientName: z.string().trim().min(1, "Recipient name is required").max(80),
    addressLine: z.string().trim().min(1, "Address is required").max(120),
    addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    postcode: z.string().trim().min(1, "Postcode is required").max(20),
    country: z
      .string()
      .trim()
      .min(1, "Country is required")
      .refine((value) => Boolean(findCountryByName(value)), "Select a supported country"),
    addressType: addressTypeSchema,
    isDefault: z.boolean().optional(),
  })
  .refine((data) => validatePostcodeForCountry(data.country, data.postcode), {
    message: "Enter a valid postcode for the selected country",
    path: ["postcode"],
  });

export type AddressInput = z.infer<typeof addressInputSchema>;

export const appearanceModeSchema = z.enum(["light", "dark", "system"]);

export const profileVisibilitySchema = z.enum(["public", "members_only", "private"]);

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, "Timezone is required")
  .max(64, "Timezone is too long");

export const currencySchema = z
  .string()
  .trim()
  .min(1, "Currency is required")
  .max(20, "Currency is too long");

// Single source of truth: derived from the locale registry so the two never drift.
export const localeCodeSchema = z.enum(
  SUPPORTED_LOCALE_CODES as [string, ...string[]],
);

export const settingsPatchSchema = z.object({
  pushNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  language: z.string().trim().min(1).max(40).optional(),
  currency: currencySchema.optional(),
  vacationMode: z.boolean().optional(),
  localeCode: localeCodeSchema.optional(),
  appearanceMode: appearanceModeSchema.optional(),
  timezone: timezoneSchema.optional(),
  profileVisibility: profileVisibilitySchema.optional(),
  marketingEmails: z.boolean().optional(),
  showActivityStatus: z.boolean().optional(),
});

export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;

export const privacyPatchSchema = z.object({
  profileVisibility: profileVisibilitySchema,
  marketingEmails: z.boolean(),
  showActivityStatus: z.boolean(),
});

export type PrivacyPatchInput = z.infer<typeof privacyPatchSchema>;

export const buyerPreferencesSchema = z.object({
  saveSearchAlerts: z.boolean(),
  orderUpdatesPush: z.boolean(),
  orderUpdatesEmail: z.boolean(),
  showRecommendations: z.boolean(),
  region: z.string().refine((value) => BUYER_REGIONS.includes(value), "Select a supported region"),
  preferredCategorySlugs: z.array(z.string().trim().min(1).max(120)).max(12),
});

export type BuyerPreferencesInput = z.infer<typeof buyerPreferencesSchema>;

export const sellerShippingSettingsSchema = z.object({
  handlingTimeDays: z.coerce.number().int().min(0).max(30),
  dispatchTimeDays: z.coerce.number().int().min(0).max(30),
  baseShippingCost: z.coerce.number().min(0).max(99999),
  freeShippingThreshold: z
    .preprocess((value) => {
      if (value === "" || value === null || value === undefined) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }, z.number().min(0).max(99999).nullable()),
  defaultCarrier: z.string().trim().min(1).max(80),
  shipsTo: z.string().trim().min(1).max(120),
  localPickupEnabled: z.boolean(),
  internationalShippingEnabled: z.boolean(),
  returnPolicyDays: z.coerce.number().int().min(0).max(90),
});

export type SellerShippingSettingsInput = z.infer<typeof sellerShippingSettingsSchema>;
export type SellerShippingSettingsFormInput = z.input<typeof sellerShippingSettingsSchema>;

export const blockUsernameSchema = z.object({
  username: usernameSchema,
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const emailChangeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export type EmailChangeInput = z.infer<typeof emailChangeSchema>;

export const notificationPreferencesPatchSchema = z.object({
  orders: z.boolean().optional(),
  messages: z.boolean().optional(),
  payments: z.boolean().optional(),
  support: z.boolean().optional(),
  marketing: z.boolean().optional(),
  security: z.boolean().optional(),
  business: z.boolean().optional(),
  ai: z.boolean().optional(),
});

export type NotificationPreferencesPatchInput = z.infer<typeof notificationPreferencesPatchSchema>;

export const notificationSettingsPatchSchema = z.object({
  pushEnabled: z.boolean().optional(),
  browserPush: z.boolean().optional(),
  messages: z.boolean().optional(),
  orders: z.boolean().optional(),
  offers: z.boolean().optional(),
  reviews: z.boolean().optional(),
  promotions: z.boolean().optional(),
  marketing: z.boolean().optional(),
  system: z.boolean().optional(),
  emailMessages: z.boolean().optional(),
  emailOrders: z.boolean().optional(),
  emailPromotions: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  sound: z.boolean().optional(),
  vibration: z.boolean().optional(),
});
