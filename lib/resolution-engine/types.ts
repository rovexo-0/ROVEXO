/**
 * ROVEXO Resolution Engine v1.0 — domain types (Phase 4).
 */

export type ResolutionCaseType =
  | "lost"
  | "damaged"
  | "return"
  | "failed_delivery"
  | "carrier_exception"
  | "delivery"
  | "buyer_confirm"
  | "buyer_timeout"
  | "dispute";

export type ResolutionCaseStatus =
  | "OPEN"
  | "PROCESSING"
  | "WAITING_CARRIER"
  | "WAITING_TRACKING"
  | "WAITING_RETURN"
  | "APPROVED"
  | "REJECTED"
  | "REFUNDED"
  | "CLOSED";

export type ResolutionTriggerEvent =
  | "PAYMENT_CAPTURED"
  | "LABEL_CREATED"
  | "SHIPMENT_CREATED"
  | "TRACKING_UPDATED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RETURN_STARTED"
  | "RETURN_RECEIVED"
  | "LOST"
  | "DAMAGED"
  | "FAILED_DELIVERY"
  | "CARRIER_EXCEPTION"
  | "BUYER_CONFIRM"
  | "BUYER_TIMEOUT"
  | "WEBHOOK_RECEIVED"
  | "CRON_SYNC";

export type ResolutionCaseRow = {
  id: string;
  order_id: string;
  buyer_id: string | null;
  seller_id: string | null;
  protection_case_id: string | null;
  case_type: ResolutionCaseType;
  status: ResolutionCaseStatus;
  trigger_event: string | null;
  rule_id: string | null;
  refund_amount: number | null;
  decision: string | null;
  estimated_completion_at: string | null;
  resolved_at: string | null;
  correlation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ResolutionEventRow = {
  id: string;
  case_id: string;
  order_id: string | null;
  event_type: string;
  message: string;
  rule_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CarrierClaimRow = {
  id: string;
  order_id: string;
  resolution_case_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  claim_type: string;
  status: string;
  provider: string;
  external_reference: string | null;
  amount_claimed: number;
  amount_approved: number | null;
  submitted_at: string;
  responded_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CarrierReturnRow = {
  id: string;
  order_id: string;
  resolution_case_id: string | null;
  status: string;
  return_tracking_number: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrderResolutionSummary = {
  orderId: string;
  activeCase: ResolutionCaseRow | null;
  status: ResolutionCaseStatus | "none";
  refundAmount: number | null;
  estimatedCompletionAt: string | null;
  claimStatus: string | null;
  returnStatus: string | null;
  events: ResolutionEventRow[];
};

export type ResolutionMonitorStats = {
  openCases: number;
  processingCases: number;
  refundedCases: number;
  closedCases: number;
  carrierClaimsOpen: number;
  automationActions24h: number;
};
