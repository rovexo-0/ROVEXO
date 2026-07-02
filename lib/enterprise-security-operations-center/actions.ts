import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformSocAction } from "@/lib/enterprise-security-operations-center/audit";
import { getSocLiveDocument, socConfigLifecycle } from "@/lib/enterprise-security-operations-center/config";
import { executeSocConfigAction, isSocConfigAction } from "@/lib/enterprise-security-operations-center/config-actions";
import type { SocConfigDocument } from "@/lib/enterprise-security-operations-center/config";
import { ENTERPRISE_SOC_MODULE_DESCRIPTOR } from "@/lib/enterprise-security-operations-center/descriptor";
import { createSecurityEvent } from "@/lib/enterprise-security-operations-center/events";
import { blockIpRule } from "@/lib/enterprise-security-operations-center/firewall";
import { lockDevice, revokeDevice } from "@/lib/enterprise-security-operations-center/devices";
import { runFullScan } from "@/lib/enterprise-security-operations-center/scanner";
import { generateSocAiInsights } from "@/lib/enterprise-security-operations-center/ai-integration";
import { applySocAutomations } from "@/lib/enterprise-security-operations-center/automations";
import { exportSocSnapshot, exportThreatReport, isValidSocExportFormat, parseSocImportPayload } from "@/lib/enterprise-security-operations-center/export";
import { getSocSnapshot } from "@/lib/enterprise-security-operations-center/reader";

export async function executeSocAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isSocConfigAction(action)) {
    return executeSocConfigAction(action, actorId, payload as { document?: SocConfigDocument; historyId?: string });
  }

  const permission = canPerformSocAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getSocLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_SOC_MODULE_DESCRIPTOR.id,
    action,
  });

  const appendTimeline = (summary: string) => [
    { id: `tl-${Date.now()}`, action: summary, actor: actorId, timestamp: new Date().toISOString() },
    ...live.settings.auditTimeline,
  ];

  switch (action) {
    case "scan": {
      const scannerResults = runFullScan();
      const aiInsights = generateSocAiInsights(live.settings.events, live.settings.intrusions);
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, scannerResults, aiInsights }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { scannerResults };
    }
    case "block": {
      const ip = String(payload?.ip ?? payload?.target ?? "");
      if (!ip) throw new Error("IP required");
      const rule = blockIpRule(ip);
      const event = createSecurityEvent({ category: "api", level: "high", summary: `Blocked IP ${ip}`, source: actorId, ip, blocked: true });
      const { actions, blockRule } = applySocAutomations(event, live.settings);
      const firewallRules = blockRule ? [blockRule, ...live.settings.firewallRules] : [rule, ...live.settings.firewallRules];
      await socConfigLifecycle.saveDraft(
        {
          ...live,
          settings: {
            ...live.settings,
            firewallRules,
            events: [event, ...live.settings.events],
            auditTimeline: appendTimeline(`block:${ip}`),
          },
          auditLog: [auditEntry, ...live.auditLog].slice(0, 100),
        },
        actorId,
      );
      return { blocked: ip, automations: actions };
    }
    case "unblock": {
      const ip = String(payload?.ip ?? "");
      const firewallRules = live.settings.firewallRules.map((r) =>
        r.type === "ip" && r.value === ip ? { ...r, enabled: false } : r,
      );
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, firewallRules, auditTimeline: appendTimeline(`unblock:${ip}`) }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { unblocked: ip };
    }
    case "quarantine": {
      const targetId = String(payload?.targetId ?? payload?.eventId ?? "");
      const events = live.settings.events.map((e) =>
        e.id === targetId ? { ...e, blocked: true, level: "critical" as const } : e,
      );
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, events, auditTimeline: appendTimeline(`quarantine:${targetId}`) }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { quarantined: targetId };
    }
    case "isolate": {
      const deviceId = String(payload?.deviceId ?? "");
      const devices = live.settings.devices.map((d) => (d.id === deviceId ? lockDevice(d) : d));
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, devices, auditTimeline: appendTimeline(`isolate:${deviceId}`) }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { isolated: deviceId };
    }
    case "rotate": {
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, auditTimeline: appendTimeline("rotate:credentials") }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { rotated: true };
    }
    case "revoke": {
      const sessionId = String(payload?.sessionId ?? "");
      const deviceId = String(payload?.deviceId ?? "");
      let sessions = live.settings.sessions;
      let devices = live.settings.devices;
      if (sessionId) sessions = sessions.filter((s) => s.id !== sessionId);
      if (deviceId) devices = devices.map((d) => (d.id === deviceId ? revokeDevice(d) : d));
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, sessions, devices, auditTimeline: appendTimeline(`revoke:${sessionId || deviceId}`) }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { revoked: sessionId || deviceId };
    }
    case "toggle-lockdown": {
      const emergencyLockdown = !live.settings.emergencyLockdown;
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, emergencyLockdown, auditTimeline: appendTimeline(emergencyLockdown ? "lockdown:enabled" : "lockdown:disabled") }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { emergencyLockdown };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidSocExportFormat(format)) throw new Error("Invalid export format");
      const reportType = String(payload?.reportType ?? "snapshot");
      const snapshot = await getSocSnapshot("dashboard");
      const data = reportType === "threats" ? exportThreatReport(snapshot, format) : exportSocSnapshot(snapshot, format);
      return { exported: data, format };
    }
    case "import": {
      const raw = String(payload?.data ?? "{}");
      const parsed = parseSocImportPayload(raw);
      if (!parsed.events?.length) throw new Error("No events in import payload");
      const events = [...parsed.events, ...live.settings.events].slice(0, 500);
      await socConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, events }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { imported: parsed.events.length };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
