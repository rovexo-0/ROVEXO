import type { UkCarrier } from "@/lib/shipping/carriers";

/** Normalize Sendcloud carrier codes for alias lookup. */
export function normalizeSendcloudCarrierKey(carrier: string): string {
  return carrier.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

const EXACT_ALIASES: Record<string, UkCarrier> = {
  royal_mail: "Royal Mail",
  royalmail: "Royal Mail",
  royal_mail_v2: "Royal Mail",
  royal_mailv2: "Royal Mail",
  postnl: "Royal Mail",
  dpd: "DPD",
  dpd_uk: "DPD",
  dpd_gb: "DPD",
  hermes: "Evri",
  hermes_uk: "Evri",
  hermes_c2c: "Evri",
  hermes_c2c_gb: "Evri",
  evri: "Evri",
  inpost: "InPost",
  inpost_gb: "InPost",
  fedex: "FedEx",
  ups: "UPS",
  parcelforce: "Parcelforce",
  dhl: "DHL",
  dhl_gb: "DHL",
  dhl_express: "DHL",
};

const PREFIX_ALIASES: { prefix: string; carrier: UkCarrier }[] = [
  { prefix: "royal_mail", carrier: "Royal Mail" },
  { prefix: "royalmail", carrier: "Royal Mail" },
  { prefix: "dpd", carrier: "DPD" },
  { prefix: "hermes", carrier: "Evri" },
  { prefix: "evri", carrier: "Evri" },
  { prefix: "inpost", carrier: "InPost" },
  { prefix: "fedex", carrier: "FedEx" },
  { prefix: "ups", carrier: "UPS" },
  { prefix: "parcelforce", carrier: "Parcelforce" },
  { prefix: "dhl", carrier: "DHL" },
];

/**
 * Map a Sendcloud carrier identifier to a ROVEXO UK checkout carrier.
 * Returns null for non-carrier Sendcloud placeholders (e.g. "sendcloud").
 */
export function mapSendcloudCarrierToUk(carrier: string): UkCarrier | null {
  const key = normalizeSendcloudCarrierKey(carrier);
  if (!key || key === "sendcloud") return null;

  const exact = EXACT_ALIASES[key];
  if (exact) return exact;

  for (const rule of PREFIX_ALIASES) {
    if (key.startsWith(rule.prefix)) return rule.carrier;
  }

  return null;
}
