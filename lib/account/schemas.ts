import { z } from "zod";

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

export const addressInputSchema = z.object({
  recipientName: z.string().trim().min(1, "Recipient name is required").max(80),
  addressLine: z.string().trim().min(1, "Address is required").max(120),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postcode: z.string().trim().min(1, "Postcode is required").max(20),
  country: z.string().trim().min(1, "Country is required").max(80),
  addressType: addressTypeSchema,
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

export const appearanceModeSchema = z.enum(["light", "dark", "system"]);

export const localeCodeSchema = z.enum([
  "en-IE",
  "en-GB",
  "de-DE",
  "fr-FR",
  "es-ES",
  "it-IT",
  "nl-NL",
  "pl-PL",
]);

export const settingsPatchSchema = z.object({
  pushNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  language: z.string().trim().min(1).max(40).optional(),
  currency: z.string().trim().min(1).max(20).optional(),
  vacationMode: z.boolean().optional(),
  localeCode: localeCodeSchema.optional(),
  appearanceMode: appearanceModeSchema.optional(),
});

export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;

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
