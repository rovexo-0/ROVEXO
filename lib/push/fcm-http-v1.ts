import "server-only";

import { createHash } from "node:crypto";
import type { Messaging } from "firebase-admin/messaging";
import type { PushPriority } from "@/lib/push/vapid";

export const FCM_HTTP_V1_PROJECT_ID = "rovexo-production";
export const PUSH_DEVICE_TOKENS_TABLE = "push_device_tokens";

const MAX_FCM_TOKEN_LENGTH = 4096;

const STALE_FCM_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "UNREGISTERED",
  "NOT_FOUND",
]);

export type FcmCredentialStatus = "configured" | "not_configured";

export type FcmSendInput = {
  token: string;
  title: string;
  body: string;
  data: Record<string, string>;
  priority: PushPriority;
  channelId: string;
};

export type FcmTransportResult =
  | { ok: true }
  | { ok: false; stale: boolean; reason: string };

export type FcmTransport = (input: FcmSendInput) => Promise<FcmTransportResult>;

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export function fingerprintFcmToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 12);
}

export function isPlausibleFcmToken(token: unknown): token is string {
  return typeof token === "string" && token.trim().length > 0 && token.trim().length <= MAX_FCM_TOKEN_LENGTH;
}

function readJsonServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    const clientEmail = parsed.client_email?.trim();
    const privateKey = parsed.private_key?.replace(/\\n/g, "\n")?.trim();
    if (!clientEmail || !privateKey) return null;
    return {
      projectId: parsed.project_id?.trim() || FCM_HTTP_V1_PROJECT_ID,
      clientEmail,
      privateKey,
    };
  } catch {
    return null;
  }
}

function readSplitServiceAccount(): ServiceAccount | null {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")?.trim();
  if (!clientEmail || !privateKey) return null;
  return {
    projectId: process.env.FIREBASE_PROJECT_ID?.trim() || FCM_HTTP_V1_PROJECT_ID,
    clientEmail,
    privateKey,
  };
}

export function readFcmServiceAccount(): ServiceAccount | null {
  return readJsonServiceAccount() ?? readSplitServiceAccount();
}

export function getFcmCredentialStatus(): FcmCredentialStatus {
  return readFcmServiceAccount() ? "configured" : "not_configured";
}

export function isFcmHttpV1Configured(): boolean {
  return getFcmCredentialStatus() === "configured";
}

export function mapFcmAndroidChannel(eventType?: string): string {
  switch (eventType) {
    case "message":
    case "offer":
      return "rovexo.messages";
    case "order":
      return "rovexo.orders";
    case "review":
    case "payment":
    case "saved_item_sold":
    case "price_reduced":
    case "saved_search_match":
      return "rovexo.account";
    default:
      return "rovexo.platform";
  }
}

export function buildFcmDataPayload(input: {
  notificationId?: string | null;
  type?: string | null;
  href: string;
  conversationId?: string | null;
  offerId?: string | null;
  orderId?: string | null;
  pushTraceId: string;
}): Record<string, string> {
  const data: Record<string, string> = {
    href: input.href,
    pushTraceId: input.pushTraceId,
  };
  if (input.notificationId) data.notificationId = input.notificationId;
  if (input.type) data.type = input.type;
  if (input.conversationId) data.conversationId = input.conversationId;
  if (input.offerId) data.offerId = input.offerId;
  if (input.orderId) data.orderId = input.orderId;
  return data;
}

export function isStaleFcmErrorCode(code: string | undefined): boolean {
  return Boolean(code && STALE_FCM_CODES.has(code));
}

function readMessagingErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const record = error as { code?: string; errorInfo?: { code?: string } };
  return record.errorInfo?.code ?? record.code;
}

let messagingClient: Promise<Messaging> | null = null;

async function getFirebaseMessaging(): Promise<Messaging | null> {
  const account = readFcmServiceAccount();
  if (!account) return null;
  if (!messagingClient) {
    messagingClient = (async () => {
      const admin = await import("firebase-admin");
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: account.projectId,
            clientEmail: account.clientEmail,
            privateKey: account.privateKey,
          }),
        });
      }
      return admin.messaging();
    })();
  }
  try {
    return await messagingClient;
  } catch {
    messagingClient = null;
    return null;
  }
}

export async function sendFcmHttpV1(input: FcmSendInput): Promise<FcmTransportResult> {
  if (!isPlausibleFcmToken(input.token)) {
    return { ok: false, stale: true, reason: "invalid_token_shape" };
  }

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return { ok: false, stale: false, reason: "fcm_credential_not_configured" };
  }

  const androidPriority = input.priority === "emergency" || input.priority === "high" ? "high" : "normal";

  try {
    await messaging.send({
      token: input.token,
      notification: {
        title: input.title,
        body: input.body,
      },
      data: input.data,
      android: {
        priority: androidPriority,
        notification: {
          title: input.title,
          body: input.body,
          channelId: input.channelId,
        },
      },
    });
    return { ok: true };
  } catch (error: unknown) {
    const code = readMessagingErrorCode(error);
    return {
      ok: false,
      stale: isStaleFcmErrorCode(code),
      reason: code || "fcm_send_failed",
    };
  }
}

export function toFcmSendInput(
  token: string,
  payload: { title: string; body: string; eventType?: string; priority?: PushPriority },
  data: Record<string, string>,
): FcmSendInput {
  return {
    token,
    title: payload.title,
    body: payload.body,
    data,
    priority: payload.priority ?? "normal",
    channelId: mapFcmAndroidChannel(payload.eventType),
  };
}
