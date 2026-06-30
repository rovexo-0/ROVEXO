import { createEnterpriseConfigAuditEntry } from "@/lib/enterprise-architecture";
import { canPerformBiAction } from "@/lib/enterprise-business-intelligence/audit";
import { getBiLiveDocument, biConfigLifecycle } from "@/lib/enterprise-business-intelligence/config";
import { executeBiConfigAction, isBiConfigAction } from "@/lib/enterprise-business-intelligence/config-actions";
import type { BiConfigDocument } from "@/lib/enterprise-business-intelligence/config";
import { ENTERPRISE_BI_MODULE_DESCRIPTOR } from "@/lib/enterprise-business-intelligence/descriptor";
import { refreshBiMetrics } from "@/lib/enterprise-business-intelligence/engine";
import { recalculateKpis, isValidKpiPeriod } from "@/lib/enterprise-business-intelligence/kpis";
import { runForecast, isValidForecastType, generateForecasts } from "@/lib/enterprise-business-intelligence/forecasting";
import { generateReport, isValidReportType } from "@/lib/enterprise-business-intelligence/reports";
import { exportBiSnapshot, isValidBiExportFormat, parseBiImportPayload } from "@/lib/enterprise-business-intelligence/export";
import { getBiSnapshot } from "@/lib/enterprise-business-intelligence/reader";

export async function executeBiAction(action: string, actorId: string, payload?: Record<string, unknown>) {
  if (isBiConfigAction(action)) {
    return executeBiConfigAction(action, actorId, payload as { document?: BiConfigDocument; historyId?: string });
  }

  const permission = canPerformBiAction({ action, mfaVerified: Boolean(payload?.mfaVerified) });
  if (!permission.allowed) throw new Error(permission.reason ?? "Action not allowed");

  const live = await getBiLiveDocument();
  const auditEntry = createEnterpriseConfigAuditEntry({
    administrator: actorId,
    module: ENTERPRISE_BI_MODULE_DESCRIPTOR.id,
    action,
  });

  switch (action) {
    case "refresh": {
      const period = String(payload?.period ?? live.settings.defaultPeriod);
      const refreshed = refreshBiMetrics(
        {
          kpis: live.settings.kpis,
          financial: live.settings.financial,
          marketplace: live.settings.marketplace,
          userAnalytics: live.settings.userAnalytics,
          traffic: live.settings.traffic,
          forecasts: live.settings.forecasts,
          reports: live.settings.reports,
        },
        isValidKpiPeriod(period) ? period : live.settings.defaultPeriod,
      );
      await biConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, ...refreshed }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { refreshed: true };
    }
    case "calculate": {
      const period = String(payload?.period ?? live.settings.defaultPeriod);
      const kpis = recalculateKpis(
        live.settings.kpis,
        isValidKpiPeriod(period) ? period : live.settings.defaultPeriod,
      );
      await biConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, kpis }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { kpis };
    }
    case "forecast": {
      const type = String(payload?.forecastType ?? "");
      const forecasts = type && isValidForecastType(type)
        ? [runForecast(type)!, ...live.settings.forecasts.filter((f) => f.type !== type)]
        : generateForecasts();
      await biConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, forecasts }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { forecasts };
    }
    case "generate-report": {
      const reportType = String(payload?.reportType ?? "revenue");
      if (!isValidReportType(reportType)) throw new Error("Invalid report type");
      const report = generateReport(reportType);
      const reports = [report, ...live.settings.reports];
      await biConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, reports }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { report };
    }
    case "export": {
      const format = String(payload?.format ?? "json");
      if (!isValidBiExportFormat(format)) throw new Error("Invalid export format");
      const snapshot = await getBiSnapshot("export");
      const exported = exportBiSnapshot(snapshot, format);
      return { exported, format };
    }
    case "import": {
      const raw = String(payload?.data ?? "{}");
      const parsed = parseBiImportPayload(raw);
      if (!parsed.kpis?.length) throw new Error("No KPIs in import payload");
      await biConfigLifecycle.saveDraft(
        { ...live, settings: { ...live.settings, kpis: parsed.kpis }, auditLog: [auditEntry, ...live.auditLog].slice(0, 100) },
        actorId,
      );
      return { imported: parsed.kpis.length };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
