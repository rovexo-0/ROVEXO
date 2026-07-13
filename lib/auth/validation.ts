import { z } from "zod";

export const authEmailSchema = z.string().trim().email("Enter a valid email address.");

export const authPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.");

export const authNameSchema = z.string().trim().min(1, "This field is required.");

export function parseAuthEmail(value: unknown): string {
  return authEmailSchema.parse(value);
}

export function parseAuthPassword(value: unknown): string {
  return authPasswordSchema.parse(value);
}
