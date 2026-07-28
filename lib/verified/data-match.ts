/**
 * ROVEXO Verified Engine v1.0 — Data Match Engine.
 * Fail closed: any mismatch or missing required field → FAIL.
 */

import type { RovexoDataMatchInput, RovexoDataMatchResult } from "@/lib/verified/types";

function normalizeName(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  // Allow "First Last" vs "Last First" reorder when token sets match.
  const tokensA = a.split(" ").filter(Boolean).sort().join(" ");
  const tokensB = b.split(" ").filter(Boolean).sort().join(" ");
  return tokensA.length > 0 && tokensA === tokensB;
}

/**
 * Validates personal → phone → email → payment/bank holder → business/company consistency.
 * Missing required personal identity fields fail closed immediately.
 */
export function evaluateDataMatch(input: RovexoDataMatchInput): RovexoDataMatchResult {
  const failedSteps: string[] = [];

  const fullName = normalizeName(input.fullName);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const holder = normalizeName(input.accountHolderName);

  if (!fullName || fullName.length < 2) {
    failedSteps.push("personal_details");
  }
  if (!email || !email.includes("@")) {
    failedSteps.push("email");
  }
  if (!phone || phone.length < 10) {
    failedSteps.push("phone_number");
  }
  if (!holder || holder.length < 2) {
    failedSteps.push("bank_account");
  }

  // Fail closed immediately on any missing required field.
  if (failedSteps.length > 0) {
    return { pass: false, failedSteps };
  }

  if (!namesMatch(fullName, holder)) {
    failedSteps.push("bank_account_name_mismatch");
  }

  const businessName = normalizeName(input.businessName);
  const companyName = normalizeName(input.companyName);
  if (businessName && companyName && !namesMatch(businessName, companyName)) {
    failedSteps.push("company_information_mismatch");
  }

  if (failedSteps.length > 0) {
    return { pass: false, failedSteps };
  }

  return { pass: true, failedSteps: [] };
}
