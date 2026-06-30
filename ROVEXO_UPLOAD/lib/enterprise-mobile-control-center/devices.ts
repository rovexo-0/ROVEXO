import type { MobileDevice } from "@/lib/enterprise-mobile-control-center/types";
import type { DeviceAction } from "@/lib/enterprise-mobile-control-center/types";
import { DEVICE_ACTIONS } from "@/lib/enterprise-mobile-control-center/registry";

export function createDefaultDevices(): MobileDevice[] {
  const now = new Date().toISOString();
  return [
    {
      id: "dev-1",
      name: "Pixel 8 Pro",
      platform: "android",
      appVersion: "2.4.0",
      online: true,
      lastSync: now,
      lastLogin: now,
      battery: 78,
      pushToken: "fcm-token-abc",
      securityStatus: "trusted",
      healthScore: 92,
    },
    {
      id: "dev-2",
      name: "iPhone 15 Pro",
      platform: "ios",
      appVersion: "2.3.9",
      online: false,
      lastSync: new Date(Date.now() - 86400000).toISOString(),
      lastLogin: new Date(Date.now() - 3600000).toISOString(),
      battery: 45,
      pushToken: "apns-token-xyz",
      securityStatus: "trusted",
      healthScore: 88,
    },
    {
      id: "dev-3",
      name: "Galaxy S24",
      platform: "android",
      appVersion: "2.4.0",
      online: true,
      lastSync: now,
      lastLogin: now,
      battery: 62,
      pushToken: "fcm-token-def",
      securityStatus: "warning",
      healthScore: 71,
    },
  ];
}

export function countOnlineDevices(devices: MobileDevice[]): number {
  return devices.filter((d) => d.online).length;
}

export function countOfflineDevices(devices: MobileDevice[]): number {
  return devices.filter((d) => !d.online).length;
}

export function isValidDeviceAction(action: string): action is DeviceAction {
  return (DEVICE_ACTIONS as readonly string[]).includes(action);
}

export function applyDeviceAction(device: MobileDevice, action: DeviceAction): MobileDevice {
  switch (action) {
    case "remote-logout":
      return { ...device, online: false, lastLogin: new Date().toISOString() };
    case "disable-device":
      return { ...device, securityStatus: "blocked", online: false };
    case "force-sync":
      return { ...device, lastSync: new Date().toISOString() };
    case "lock-session":
      return { ...device, securityStatus: "warning" };
    case "send-notification":
      return device;
    default:
      return device;
  }
}

export function averageDeviceHealth(devices: MobileDevice[]): number {
  if (devices.length === 0) return 0;
  return Math.round(devices.reduce((s, d) => s + d.healthScore, 0) / devices.length);
}
