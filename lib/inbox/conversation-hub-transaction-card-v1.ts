/**
 * ConversationHub transaction-card path — Buyer and Seller share one compose.
 * Production uses live order + dispute only. Local QA overlays are not a product path.
 */

import type { ConversationDisputeView, ConversationTrackingView } from "@/lib/inbox/conversation-view";
import {
  resolveTransactionStatusCard,
  type TransactionStatusCardModel,
} from "@/lib/inbox/transaction-status-card-v1";
import type { LostParcelLogicalState } from "@/lib/resolution-engine/lost-parcel-resolution-v1";
import type { SenderRole } from "@/lib/messages/types";
import type { Order } from "@/lib/orders/types";

export type ConversationHubTransactionCardInput = {
  viewerRole: SenderRole;
  order: Order | null | undefined;
  hasAcceptedOffer: boolean;
  hasShippingLabel: boolean;
  tracking: ConversationTrackingView | null | undefined;
  checkoutResumeAvailable?: boolean;
  liveDispute?: ConversationDisputeView | null;
  buyerNonDeliveryUi?: boolean;
  reasonId?: string | null;
  returnStatus?: string | null;
};

export type ConversationHubTransactionCardView = {
  uiOrder: Order | null;
  dispute: ConversationDisputeView | null;
  lossState: LostParcelLogicalState | null;
  card: TransactionStatusCardModel | null;
};

export function resolveConversationHubTransactionCardView(
  input: ConversationHubTransactionCardInput,
): ConversationHubTransactionCardView {
  const uiOrder = input.order ?? null;
  const dispute = input.liveDispute ?? null;
  const lossState: LostParcelLogicalState | null = input.buyerNonDeliveryUi
    ? "WAITING_FOR_CARRIER"
    : null;
  return {
    uiOrder,
    dispute,
    lossState,
    card: resolveTransactionStatusCard({
      viewerRole: input.viewerRole,
      order: uiOrder,
      hasAcceptedOffer: input.hasAcceptedOffer,
      hasShippingLabel: input.hasShippingLabel,
      tracking: input.tracking,
      checkoutResumeAvailable: input.checkoutResumeAvailable,
      lossState,
      dispute,
      returnStatus: input.returnStatus ?? null,
      reasonId: input.reasonId ?? null,
    }),
  };
}
