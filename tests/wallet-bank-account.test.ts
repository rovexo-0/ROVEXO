import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  accountNumberLast4,
  formatMaskedAccountLast4,
  formatMaskedSortCodeLast2,
  formatSortCode,
  isValidAccountNumber,
  isValidSortCode,
  normalizeUkAccountNumber,
  resolveBankAccountDisplayName,
  validateBankAccountInput,
} from "@/lib/wallet/bank-account";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("UK sort code validation", () => {
  it("accepts 6 digits with or without separators", () => {
    expect(isValidSortCode("123456")).toBe(true);
    expect(isValidSortCode("12-34-56")).toBe(true);
    expect(isValidSortCode("12 34 56")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidSortCode("12345")).toBe(false);
    expect(isValidSortCode("1234567")).toBe(false);
    expect(isValidSortCode("")).toBe(false);
  });

  it("formats as dashed groups", () => {
    expect(formatSortCode("123456")).toBe("12-34-56");
    expect(formatSortCode("1234")).toBe("12-34");
  });
});

describe("UK account number validation", () => {
  it("accepts 7 or 8 digits", () => {
    expect(isValidAccountNumber("12345678")).toBe(true);
    expect(isValidAccountNumber("1234567")).toBe(true);
  });

  it("rejects other lengths", () => {
    expect(isValidAccountNumber("123456")).toBe(false);
    expect(isValidAccountNumber("123456789")).toBe(false);
    expect(isValidAccountNumber("abcd1234")).toBe(false);
  });

  it("exposes last 4 for masked display", () => {
    expect(accountNumberLast4("12345678")).toBe("5678");
  });
});

describe("validateBankAccountInput", () => {
  const valid = {
    accountHolderName: "Alex Taylor",
    sortCode: "12-34-56",
    accountNumber: "12345678",
    confirmAccountNumber: "12345678",
  };

  it("passes and normalizes valid input", () => {
    const result = validateBankAccountInput(valid);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.normalized).toEqual({
        accountHolderName: "Alex Taylor",
        sortCode: "123456",
        accountNumber: "12345678",
      });
    }
  });

  it("requires an account holder name", () => {
    const result = validateBankAccountInput({ ...valid, accountHolderName: " " });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.accountHolderName).toBeDefined();
  });

  it("flags mismatched account numbers", () => {
    const result = validateBankAccountInput({ ...valid, confirmAccountNumber: "87654321" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.confirmAccountNumber).toBeDefined();
  });

  it("zero-pads a 7-digit account number and keeps leading zeroes", () => {
    const result = validateBankAccountInput({
      ...valid,
      accountNumber: "0123456",
      confirmAccountNumber: "0123456",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.normalized.accountNumber).toBe("00123456");
      expect(normalizeUkAccountNumber("01234567")).toBe("01234567");
    }
  });

  it("flags invalid sort code and account number", () => {
    const result = validateBankAccountInput({
      accountHolderName: "Alex Taylor",
      sortCode: "12",
      accountNumber: "123",
      confirmAccountNumber: "123",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.sortCode).toBeDefined();
      expect(result.errors.accountNumber).toBeDefined();
    }
  });
});

describe("Bank Account identification display", () => {
  it("masks last 4 and sort last 2 only", () => {
    expect(formatMaskedAccountLast4("1234")).toBe("•••• 1234");
    expect(formatMaskedAccountLast4("")).toBe("•••• ••••");
    expect(formatMaskedSortCodeLast2("19")).toBe("Sort code ••-••-19");
    expect(formatMaskedSortCodeLast2(null)).toBe("Sort code ••-••-••");
  });

  it("uses the stored label and never invents a bank brand", () => {
    expect(resolveBankAccountDisplayName("Bank account")).toBe("Bank Account");
    expect(resolveBankAccountDisplayName("")).toBe("Bank Account");
    expect(resolveBankAccountDisplayName("Custom payout label")).toBe("Custom payout label");
  });

  it("keeps the identification card on the existing modal without a second edit flow", () => {
    const form = readSource("features/wallet/components/BankAccountForm.tsx");
    const route = readSource("app/api/wallet/bank-account/route.ts");
    const store = readSource("lib/wallet/store.ts");

    expect(form).toContain("data-bank-account-id-card");
    expect(form).toContain("BankLineIcon");
    expect(form).toContain("formatMaskedAccountLast4");
    expect(form).toContain("formatMaskedSortCodeLast2");
    expect(form).toContain("Connected");
    expect(form).toContain("focusExistingForm");
    expect(form).toContain("Account Holder");
    expect(form).toContain("Confirm Account Number");
    expect(form).not.toMatch(/Barclays|HSBC|Lloyds|NatWest|Santander/);
    expect(form).not.toContain("console.log");
    expect(form).not.toContain("getBankAccountForPayout");

    expect(route).toContain("export async function GET");
    expect(route).toContain("getBankAccountDisplaySummary");
    expect(route).toContain("sortCodeLast2");
    expect(route).not.toContain("account_number");
    expect(route).not.toContain("sort_code");

    expect(store).toContain("getBankAccountDisplaySummary");
    expect(store).toContain("digits.slice(-2)");
    expect(store).not.toContain("BANK_DETAILS_ENCRYPTION_KEY");
  });
});
