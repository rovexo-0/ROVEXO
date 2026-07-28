/**
 * ROVEXO Verified Engine v1.0 — types.
 */

export type RovexoVerifiedPath = "personal" | "self_employed" | "ltd_company";

export type RovexoVerifiedCheckId =
  | "email"
  | "phone"
  | "payment_methods"
  | "bank_account"
  | "identity"
  | "data_match"
  | "kyc"
  | "company_verification"
  | "director_verification"
  | "business_bank_account";

export type RovexoVerifiedCheck = {
  id: RovexoVerifiedCheckId;
  label: string;
  pass: boolean;
  required: boolean;
};

export type RovexoVerifiedEvaluation = {
  version: "v1.0";
  userId: string;
  path: RovexoVerifiedPath;
  isVerified: boolean;
  checks: RovexoVerifiedCheck[];
  failedChecks: RovexoVerifiedCheckId[];
  /** Fail-closed reason when not verified (never exposes secrets). */
  reason: string | null;
};

export type RovexoDataMatchInput = {
  fullName: string | null | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
  accountHolderName: string | null | undefined;
  businessName?: string | null | undefined;
  companyName?: string | null | undefined;
};

export type RovexoDataMatchResult = {
  pass: boolean;
  failedSteps: string[];
};

export type RovexoSmartVisibility = {
  showHolidayMode: boolean;
  showPromoteListings: boolean;
  showBusinessBankAccount: boolean;
  showPaymentMethods: boolean;
  showPersonalBankAccount: boolean;
  showWithdraw: boolean;
  allowVerifiedBadge: boolean;
  disableWithdrawForZeroBalance: boolean;
};

export type RovexoMoneyGateResult = {
  allowed: boolean;
  reason: string | null;
};
