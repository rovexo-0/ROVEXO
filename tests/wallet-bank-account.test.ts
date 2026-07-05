import { describe, expect, it } from "vitest";
import {
  accountNumberLast4,
  formatSortCode,
  isValidAccountNumber,
  isValidSortCode,
  validateBankAccountInput,
} from "@/lib/wallet/bank-account";

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
  it("accepts exactly 8 digits", () => {
    expect(isValidAccountNumber("12345678")).toBe(true);
  });

  it("rejects non-8-digit values", () => {
    expect(isValidAccountNumber("1234567")).toBe(false);
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
