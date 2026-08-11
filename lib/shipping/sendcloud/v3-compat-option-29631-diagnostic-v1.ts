/**
 * Locked Super Admin diagnostic: map legacy V2 method 29631 → V3 shipping option.
 * Read-only. No persistence. No shipment/parcel/label.
 */

export const SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1 = {
  methodId: 29631,
  quoteId: "sendcloud:29631",
  path: "/compat/shipping-options",
  /** Full path under api/v3 base. */
  absolutePathHint: "/api/v3/compat/shipping-options",
} as const;

export type SendcloudV3CompatOption29631Mapping = {
  shippingOptionCode: string | null;
  contractId: string | null;
  rawMappingConfirmed: boolean;
};

/**
 * Extract mapping fields from the official compat response without inventing values.
 */
export function extractV3CompatMappingFor29631(
  body: unknown,
): SendcloudV3CompatOption29631Mapping {
  const methodId = SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1.methodId;
  let shippingOptionCode: string | null = null;
  let contractId: string | null = null;
  const allCodes: string[] = [];

  const visit = (node: unknown): void => {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    const codeRaw =
      record.shipping_option_code ?? record.shippingOptionCode ?? null;
    const code =
      typeof codeRaw === "string" && codeRaw.trim().length > 0
        ? codeRaw.trim()
        : null;

    const methodRaw =
      record.shipping_method_id ?? record.method_id ?? record.shippingMethodId;
    const matchesMethod =
      methodRaw === methodId ||
      methodRaw === String(methodId) ||
      (Array.isArray(methodRaw) &&
        methodRaw.map((v) => Number(v)).includes(methodId));

    if (code) {
      allCodes.push(code);
      if (matchesMethod) {
        shippingOptionCode = shippingOptionCode ?? code;
      }
    }

    const contractRaw = record.contract_id ?? record.contractId;
    if (
      matchesMethod &&
      contractRaw !== undefined &&
      contractRaw !== null &&
      contractRaw !== ""
    ) {
      contractId = String(contractRaw);
    }

    for (const value of Object.values(record)) visit(value);
  };

  visit(body);

  if (!shippingOptionCode) {
    const unique = [...new Set(allCodes)];
    if (unique.length === 1) {
      shippingOptionCode = unique[0]!;
    }
  }

  // If we only found a global contract_id on the sole matching object, revisit for contract when code set via unique fallback
  if (shippingOptionCode && contractId == null) {
    const findContract = (node: unknown): void => {
      if (contractId != null || node == null) return;
      if (Array.isArray(node)) {
        for (const item of node) findContract(item);
        return;
      }
      if (typeof node !== "object") return;
      const record = node as Record<string, unknown>;
      const codeRaw = record.shipping_option_code ?? record.shippingOptionCode;
      const code =
        typeof codeRaw === "string" && codeRaw.trim().length > 0
          ? codeRaw.trim()
          : null;
      if (code === shippingOptionCode) {
        const contractRaw = record.contract_id ?? record.contractId;
        if (contractRaw !== undefined && contractRaw !== null && contractRaw !== "") {
          contractId = String(contractRaw);
        }
      }
      for (const value of Object.values(record)) findContract(value);
    };
    findContract(body);
  }

  return {
    shippingOptionCode,
    contractId,
    rawMappingConfirmed: Boolean(shippingOptionCode),
  };
}
