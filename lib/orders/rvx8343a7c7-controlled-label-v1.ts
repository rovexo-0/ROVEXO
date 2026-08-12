/**
 * P7 lock — one controlled production label generation for RVX8343A7C7 only.
 * Uses Owner-confirmed V3 code from P6.1/P6.2. Never substitutes.
 */

import { RVX8343A7C7_V3_QUOTE_PERSIST_V1 } from "@/lib/orders/rvx8343a7c7-v3-quote-persist-v1";

export const RVX8343A7C7_CONTROLLED_LABEL_V1 = {
  orderId: "7554fb35-6261-4b4b-96a5-aef0273d9b5b" as const,
  orderNumber: "RVX8343A7C7" as const,
  legacyQuoteId: "sendcloud:27227" as const,
  /** Must remain identical to P6.2 Owner-confirmed code. */
  confirmedShippingOptionCode: "inpost_gb:lockertoaddress/dropoff" as const,
  /** Owner-verified production shipping_records.id (preflight check). */
  expectedShippingRecordId: "c039191c-45a5-49d2-a125-7e9155acf0e3",
  /** Owner-verified production shipping_quotes.id (preflight check). */
  expectedShippingQuoteRowId: "dc98f660-71d3-4712-a176-763263409ee3",
  action: "controlled_label_generation_rvx8343a7c7",
} as const;

if (
  RVX8343A7C7_CONTROLLED_LABEL_V1.orderId !== RVX8343A7C7_V3_QUOTE_PERSIST_V1.orderId ||
  RVX8343A7C7_CONTROLLED_LABEL_V1.orderNumber !==
    RVX8343A7C7_V3_QUOTE_PERSIST_V1.orderNumber ||
  RVX8343A7C7_CONTROLLED_LABEL_V1.legacyQuoteId !==
    RVX8343A7C7_V3_QUOTE_PERSIST_V1.legacyQuoteId ||
  RVX8343A7C7_CONTROLLED_LABEL_V1.confirmedShippingOptionCode !==
    RVX8343A7C7_V3_QUOTE_PERSIST_V1.confirmedShippingOptionCode
) {
  throw new Error("P7 lock diverged from P6.2 persist lock.");
}
