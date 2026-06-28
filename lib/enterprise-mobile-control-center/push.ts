import type { PushCampaign, PushType } from "@/lib/enterprise-mobile-control-center/types";
import { PUSH_TYPES } from "@/lib/enterprise-mobile-control-center/registry";

const DEFAULT_MESSAGES: Record<PushType, { title: string; body: string }> = {
  broadcast: { title: "ROVEXO Update", body: "New features available in Super Admin Mobile." },
  "emergency-alert": { title: "Emergency Alert", body: "Critical platform notification requires attention." },
  "silent-push": { title: "Background Sync", body: "Silent sync initiated." },
  "update-available": { title: "Update Available", body: "A new version of Super Admin Mobile is ready." },
  "security-alert": { title: "Security Alert", body: "Unusual activity detected on your device." },
  "maintenance-alert": { title: "Maintenance", body: "Scheduled maintenance window starting soon." },
};

export function isValidPushType(type: string): type is PushType {
  return (PUSH_TYPES as readonly string[]).includes(type);
}

export function createPushCampaign(type: PushType): PushCampaign {
  const msg = DEFAULT_MESSAGES[type];
  return {
    id: `push-${Date.now()}`,
    type,
    title: msg.title,
    body: msg.body,
    status: "sent",
    deliveryRate: 0.94 + Math.random() * 0.05,
    sentAt: new Date().toISOString(),
  };
}

export function listPushTypes(): PushType[] {
  return [...PUSH_TYPES];
}

export function averagePushDelivery(campaigns: PushCampaign[]): number {
  if (campaigns.length === 0) return 0;
  return Math.round((campaigns.reduce((s, c) => s + c.deliveryRate, 0) / campaigns.length) * 100);
}

export function resolvePushStatus(deliveryRate: number): "healthy" | "degraded" | "offline" {
  if (deliveryRate >= 90) return "healthy";
  if (deliveryRate >= 70) return "degraded";
  return "offline";
}
