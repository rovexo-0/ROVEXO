/**
 * ROVEXO Bundle Payload v1.0 — same-seller multi-item draft.
 *
 * OWNER DECISION (O3): `offers` + encoded message meta is the CANONICAL offer source.
 * `bundle_offers` table remains infrastructure-only (unused by app) — zero duplicated truth.
 */

export const BUNDLE_MESSAGE_META_PREFIX = "__RVX_BUNDLE_V1__" as const;

export type BundlePayloadLine = {
  productId: string;
  slug: string;
  title: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
  condition?: string;
};

export type BundlePayloadV1 = {
  v: 1;
  /** Server bundle id — required for accept → bundle checkout. */
  bundleId?: string;
  buyerId?: string;
  sellerId: string;
  sellerName: string;
  currency?: string;
  lines: BundlePayloadLine[];
  /** Listing subtotal (sum unitPrice × qty) before negotiation. */
  listSubtotal: number;
  itemCount: number;
  quantitySum: number;
};

export function computeBundleTotals(lines: readonly BundlePayloadLine[]): {
  listSubtotal: number;
  itemCount: number;
  quantitySum: number;
} {
  const listSubtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const itemCount = lines.length;
  const quantitySum = lines.reduce((sum, line) => sum + line.quantity, 0);
  return { listSubtotal, itemCount, quantitySum };
}

export function buildBundlePayload(input: {
  sellerId: string;
  sellerName: string;
  lines: BundlePayloadLine[];
  bundleId?: string | null;
  buyerId?: string | null;
  currency?: string | null;
}): BundlePayloadV1 | null {
  if (!input.sellerId || input.lines.length === 0) return null;
  const lines = input.lines.map((line) => ({
    ...line,
    quantity: Math.max(1, Math.min(line.maxStock, Math.round(line.quantity))),
    unitPrice: Number(line.unitPrice),
  }));
  const totals = computeBundleTotals(lines);
  if (totals.listSubtotal <= 0) return null;
  return {
    v: 1,
    bundleId: input.bundleId ?? undefined,
    buyerId: input.buyerId ?? undefined,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    currency: input.currency ?? "GBP",
    lines,
    ...totals,
  };
}

export function encodeBundleMessageMeta(
  payload: BundlePayloadV1,
  userMessage?: string | null,
): string {
  const json = JSON.stringify(payload);
  const meta = `${BUNDLE_MESSAGE_META_PREFIX}${json}__`;
  const body = userMessage?.trim() ?? "";
  return body ? `${meta}${body}` : meta;
}

export function parseBundleMessageMeta(message: string | null | undefined): {
  bundle: BundlePayloadV1 | null;
  userMessage: string | null;
  /** Remainder after stripping counter meta may still contain bundle. */
  rawWithoutBundle: string | null;
} {
  if (!message) {
    return { bundle: null, userMessage: null, rawWithoutBundle: null };
  }

  const match = message.match(/__RVX_BUNDLE_V1__([\s\S]*?)__(.*)$/);
  if (!match) {
    return { bundle: null, userMessage: message, rawWithoutBundle: message };
  }

  try {
    const parsed = JSON.parse(match[1]!) as BundlePayloadV1;
    if (parsed?.v !== 1 || !Array.isArray(parsed.lines) || parsed.lines.length === 0) {
      return { bundle: null, userMessage: message, rawWithoutBundle: message };
    }
    const userMessage = match[2]?.trim() ? match[2]!.trim() : null;
    return { bundle: parsed, userMessage, rawWithoutBundle: userMessage };
  } catch {
    return { bundle: null, userMessage: message, rawWithoutBundle: message };
  }
}

/** Preserve bundle when writing counter meta (Counter Offer Engine). */
export function mergeBundleIntoOfferMessage(
  existingMessage: string | null | undefined,
  counterEncodedMessage: string,
): string {
  const { bundle } = parseBundleMessageMeta(existingMessage);
  if (!bundle) return counterEncodedMessage;
  // Counter meta first, then bundle, then any user body already in counter string.
  const counterMatch = counterEncodedMessage.match(
    /^(__RVX_COUNTER__:(?:buyer|seller):[0-9a-f-]{36}__)(.*)$/i,
  );
  if (!counterMatch) {
    return encodeBundleMessageMeta(bundle, counterEncodedMessage);
  }
  const prefix = counterMatch[1]!;
  const userBody = counterMatch[2]?.trim() ?? "";
  return `${prefix}${encodeBundleMessageMeta(bundle, userBody || null)}`;
}

export function isBundlePayload(value: unknown): value is BundlePayloadV1 {
  if (!value || typeof value !== "object") return false;
  const v = value as BundlePayloadV1;
  return v.v === 1 && Array.isArray(v.lines) && v.lines.length > 0 && Boolean(v.sellerId);
}

export function primaryBundleLine(payload: BundlePayloadV1): BundlePayloadLine {
  return payload.lines[0]!;
}
