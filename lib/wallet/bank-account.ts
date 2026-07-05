/**
 * Native ROVEXO bank-account details — validation & formatting.
 *
 * Pure, dependency-free helpers shared by the client form and the API route so
 * the same UK validation rules run in both places. No payment-processor
 * concepts leak here; this is plain UK bank-account data.
 */

export type BankAccountInput = {
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
  confirmAccountNumber: string;
};

export type BankAccountErrors = Partial<Record<keyof BankAccountInput, string>>;

export type BankAccountValidation =
  | {
      valid: true;
      errors: Record<string, never>;
      normalized: { accountHolderName: string; sortCode: string; accountNumber: string };
    }
  | { valid: false; errors: BankAccountErrors };

/** Strip everything except digits (handles "12-34-56", "12 34 56", etc.). */
export function digitsOnly(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/** UK sort codes are exactly 6 digits. */
export function isValidSortCode(value: string): boolean {
  return digitsOnly(value).length === 6;
}

/** UK account numbers are 8 digits (shorter ones should be zero-padded). */
export function isValidAccountNumber(value: string): boolean {
  return digitsOnly(value).length === 8;
}

/** Display helper: "123456" -> "12-34-56". */
export function formatSortCode(value: string): string {
  const digits = digitsOnly(value).slice(0, 6);
  return digits.replace(/(\d{2})(?=\d)/g, "$1-");
}

/** Last four digits, for masked display ("••••7517" style). */
export function accountNumberLast4(value: string): string {
  return digitsOnly(value).slice(-4);
}

export function validateBankAccountInput(input: BankAccountInput): BankAccountValidation {
  const errors: BankAccountErrors = {};

  const name = (input.accountHolderName ?? "").trim();
  if (name.length < 2) {
    errors.accountHolderName = "Enter the account holder name.";
  } else if (name.length > 100) {
    errors.accountHolderName = "Account holder name is too long.";
  }

  const sortCode = digitsOnly(input.sortCode);
  if (!isValidSortCode(input.sortCode)) {
    errors.sortCode = "Enter a valid 6-digit sort code.";
  }

  const accountNumber = digitsOnly(input.accountNumber);
  if (!isValidAccountNumber(input.accountNumber)) {
    errors.accountNumber = "Enter a valid 8-digit account number.";
  }

  const confirm = digitsOnly(input.confirmAccountNumber);
  if (!confirm) {
    errors.confirmAccountNumber = "Re-enter your account number.";
  } else if (accountNumber && confirm !== accountNumber) {
    errors.confirmAccountNumber = "Account numbers do not match.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    normalized: { accountHolderName: name, sortCode, accountNumber },
  };
}
