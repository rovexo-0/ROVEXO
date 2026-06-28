import type { DeviceRecord, SessionRecord } from "@/lib/enterprise-security-operations-center/types";

export function createDefaultDevices(): DeviceRecord[] {
  return [
    { id: "dev-1", fingerprint: "fp-a1b2c3", platform: "Windows 11 / Chrome", trusted: true, lastSeen: new Date().toISOString(), sessionCount: 3, locked: false },
    { id: "dev-2", fingerprint: "fp-d4e5f6", platform: "iOS 18 / Safari", trusted: true, lastSeen: new Date().toISOString(), sessionCount: 1, locked: false },
    { id: "dev-3", fingerprint: "fp-g7h8i9", platform: "Linux / Firefox", trusted: false, lastSeen: new Date().toISOString(), sessionCount: 2, locked: false },
    { id: "dev-4", fingerprint: "fp-j0k1l2", platform: "Android / Chrome", trusted: false, lastSeen: new Date().toISOString(), sessionCount: 1, locked: true },
  ];
}

export function createDefaultSessions(): SessionRecord[] {
  return [
    { id: "sess-1", userId: "admin-1", ip: "10.0.0.5", country: "GB", deviceId: "dev-1", suspicious: false, mfaVerified: true, startedAt: new Date(Date.now() - 3600000).toISOString(), lastActivity: new Date().toISOString() },
    { id: "sess-2", userId: "admin-1", ip: "203.0.113.42", country: "RU", deviceId: "dev-3", suspicious: true, mfaVerified: false, startedAt: new Date(Date.now() - 600000).toISOString(), lastActivity: new Date().toISOString() },
    { id: "sess-3", userId: "user-42", ip: "198.51.100.8", country: "US", suspicious: false, mfaVerified: true, startedAt: new Date(Date.now() - 7200000).toISOString(), lastActivity: new Date().toISOString() },
  ];
}

export function suspiciousSessions(sessions: SessionRecord[]): SessionRecord[] {
  return sessions.filter((s) => s.suspicious);
}

export function untrustedDevices(devices: DeviceRecord[]): DeviceRecord[] {
  return devices.filter((d) => !d.trusted);
}

export function lockDevice(device: DeviceRecord): DeviceRecord {
  return { ...device, locked: true };
}

export function revokeDevice(device: DeviceRecord): DeviceRecord {
  return { ...device, trusted: false, locked: true, sessionCount: 0 };
}

export function mfaCoverage(sessions: SessionRecord[]): number {
  if (sessions.length === 0) return 100;
  return Math.round((sessions.filter((s) => s.mfaVerified).length / sessions.length) * 100);
}
