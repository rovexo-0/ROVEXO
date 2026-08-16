/**
 * Buyer non-delivery Resolution Case — presentation only.
 * Does not change Resolution Engine transitions, claims, or Sendcloud.
 */

import type { LostParcelLogicalState } from "@/lib/resolution-engine/lost-parcel-resolution-v1";

export type NonDeliveryResolutionCaseActionId =
  | "track_parcel"
  | "add_information"
  | "contact_seller";

export type NonDeliveryResolutionCaseAction = {
  id: NonDeliveryResolutionCaseActionId;
  label: string;
};

export const NON_DELIVERY_RESOLUTION_CASE_V1 = {
  version: "1.0",
  title: "Parcel hasn't arrived",
  body: "Your parcel hasn't arrived yet. ROVEXO is waiting for the carrier to confirm the shipment status before any resolution is made.",
  awaitingCarrier: "Awaiting carrier",
  investigationOpened: "Carrier investigation opened",
  actionRequired: "Action required",
  carrierResolved: "Carrier response received",
  confirmedLoss: "Carrier confirmed loss",
  viewTracking: "View tracking",
  addInformation: "Add information",
  contactSeller: "Contact seller",
  addInformationHint: "Add any relevant details below. Photos are optional.",
  addInformationActionId: "add_information",
  contactSellerActionId: "contact_seller",
  contactSellerPlaceholder: "Write a message...",
  contactSellerAutomaticMessage: false,
  photosOptional: true,
  advancesState: false,
  createsIssue: false,
  sellerIssueOpenTitle: "Issue",
  sellerIssueOpenBody: "Your order is suspended",
  sellerNonDeliveryTitle: "Delivery issue reported",
  sellerNonDeliveryBody: "Buyer has reported that the parcel has not been received.",
  sellerViewDetails: "View Details",
} as const;

export type NonDeliveryResolutionCaseModel = {
  title: string;
  body: string;
  statusLabel: string;
  actions: readonly NonDeliveryResolutionCaseAction[];
};

export function buyerNonDeliveryStatusLabel(input: {
  state: LostParcelLogicalState | null | undefined;
  hasOfficialTicketId?: boolean;
}): string {
  const hasTicket = Boolean(input.hasOfficialTicketId);
  switch (input.state) {
    case "CARRIER_INVESTIGATION_OPEN":
      return hasTicket
        ? NON_DELIVERY_RESOLUTION_CASE_V1.investigationOpened
        : NON_DELIVERY_RESOLUTION_CASE_V1.awaitingCarrier;
    case "CARRIER_ACTION_REQUIRED":
      return NON_DELIVERY_RESOLUTION_CASE_V1.actionRequired;
    case "CARRIER_RESOLVED":
      return NON_DELIVERY_RESOLUTION_CASE_V1.carrierResolved;
    case "CARRIER_CONFIRMED_LOST":
      return NON_DELIVERY_RESOLUTION_CASE_V1.confirmedLoss;
    case "DELAYED":
    case "POSSIBLY_LOST":
    case "WAITING_FOR_CARRIER":
    default:
      return NON_DELIVERY_RESOLUTION_CASE_V1.awaitingCarrier;
  }
}

export function resolveBuyerNonDeliveryResolutionCase(input: {
  state: LostParcelLogicalState | null | undefined;
  hasOfficialTicketId?: boolean;
}): NonDeliveryResolutionCaseModel | null {
  if (
    input.state !== "DELAYED" &&
    input.state !== "POSSIBLY_LOST" &&
    input.state !== "WAITING_FOR_CARRIER" &&
    input.state !== "CARRIER_INVESTIGATION_OPEN" &&
    input.state !== "CARRIER_ACTION_REQUIRED" &&
    input.state !== "CARRIER_RESOLVED" &&
    input.state !== "CARRIER_CONFIRMED_LOST"
  ) {
    return null;
  }

  return {
    title: NON_DELIVERY_RESOLUTION_CASE_V1.title,
    body: NON_DELIVERY_RESOLUTION_CASE_V1.body,
    statusLabel: buyerNonDeliveryStatusLabel(input),
    actions: [
      { id: "track_parcel", label: NON_DELIVERY_RESOLUTION_CASE_V1.viewTracking },
      { id: "add_information", label: NON_DELIVERY_RESOLUTION_CASE_V1.addInformation },
      { id: "contact_seller", label: NON_DELIVERY_RESOLUTION_CASE_V1.contactSeller },
    ],
  };
}

export function isAddInformationAction(actionId: string): boolean {
  return actionId === NON_DELIVERY_RESOLUTION_CASE_V1.addInformationActionId;
}

/** Buyer-reported non-delivery waiting — not DELAYED preview. */
export function isSellerBuyerReportedNonDelivery(
  state: LostParcelLogicalState | null | undefined,
): boolean {
  return state === "POSSIBLY_LOST" || state === "WAITING_FOR_CARRIER";
}

export function isBuyerNonDeliveryWaitingState(
  state: LostParcelLogicalState | null | undefined,
): boolean {
  return (
    state === "DELAYED" ||
    state === "POSSIBLY_LOST" ||
    state === "WAITING_FOR_CARRIER" ||
    state === "CARRIER_INVESTIGATION_OPEN" ||
    state === "CARRIER_ACTION_REQUIRED" ||
    state === "CARRIER_RESOLVED" ||
    state === "CARRIER_CONFIRMED_LOST"
  );
}
