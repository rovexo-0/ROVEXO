import { createResolutionAdminClient } from "@/lib/resolution-engine/db-client";

export async function recordAutomationLog(input: {
  orderId?: string | null;
  caseId?: string | null;
  action: string;
  ruleId?: string | null;
  decision?: string | null;
  stripeResponse?: Record<string, unknown> | null;
  parcel2goResponse?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createResolutionAdminClient();
    await admin.from("automation_logs").insert({
      order_id: input.orderId ?? null,
      case_id: input.caseId ?? null,
      action: input.action,
      rule_id: input.ruleId ?? null,
      decision: input.decision ?? null,
      stripe_response: input.stripeResponse ?? null,
      parcel2go_response: input.parcel2goResponse ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error(
      "[resolution-engine] automation log failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function recordResolutionEvent(input: {
  caseId: string;
  orderId?: string | null;
  eventType: string;
  message: string;
  ruleId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createResolutionAdminClient();
    await admin.from("resolution_events").insert({
      case_id: input.caseId,
      order_id: input.orderId ?? null,
      event_type: input.eventType,
      message: input.message,
      rule_id: input.ruleId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    console.error(
      "[resolution-engine] resolution event failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function recordCarrierResponse(input: {
  orderId?: string | null;
  claimId?: string | null;
  returnId?: string | null;
  source: string;
  responseType: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createResolutionAdminClient();
    await admin.from("carrier_responses").insert({
      order_id: input.orderId ?? null,
      claim_id: input.claimId ?? null,
      return_id: input.returnId ?? null,
      source: input.source,
      response_type: input.responseType,
      payload: input.payload ?? {},
    });
  } catch (error) {
    console.error(
      "[resolution-engine] carrier response log failed",
      error instanceof Error ? error.message : String(error),
    );
  }
}
