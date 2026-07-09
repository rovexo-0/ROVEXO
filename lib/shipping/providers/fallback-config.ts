import "server-only";

import { getPlatformSetting, updatePlatformSetting } from "@/lib/super-admin/settings";

export const SHIPPING_PROVIDER_CONFIG_KEY = "shipping_provider_config_v1";

export type ShippingProviderConfig = {
  /** When true, Shippo is used immediately (super-admin manual fallback). */
  shippoFallbackForced: boolean;
};

const DEFAULT_CONFIG: ShippingProviderConfig = {
  shippoFallbackForced: false,
};

export async function getShippingProviderConfig(): Promise<ShippingProviderConfig> {
  return getPlatformSetting(SHIPPING_PROVIDER_CONFIG_KEY, DEFAULT_CONFIG);
}

export async function isShippoFallbackForced(): Promise<boolean> {
  const config = await getShippingProviderConfig();
  return config.shippoFallbackForced;
}

export async function setShippoFallbackForced(
  forced: boolean,
  actorId: string | null = null,
): Promise<ShippingProviderConfig> {
  const next = { shippoFallbackForced: forced };
  await updatePlatformSetting({
    actorId,
    key: SHIPPING_PROVIDER_CONFIG_KEY,
    value: next,
  });
  return next;
}
