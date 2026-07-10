export { SendcloudService } from "@/lib/shipping/sendcloud/service";
export {
  isSendcloudConfigured,
  validateSendcloudEnvironmentOnStartup,
  SENDCLOUD_DEFAULT_BASE_URL,
} from "@/lib/shipping/env";

import { SendcloudService } from "@/lib/shipping/sendcloud/service";

export function getPrimaryShippingProvider() {
  return {
    id: "sendcloud" as const,
    name: "Sendcloud",
    isConfigured: () => SendcloudService.isConfigured(),
    healthCheck: () => SendcloudService.checkHealth(),
  };
}
