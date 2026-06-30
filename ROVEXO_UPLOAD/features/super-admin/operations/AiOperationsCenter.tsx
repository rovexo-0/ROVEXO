"use client";

import { useState } from "react";
import type { AiOperationsSnapshot } from "@/lib/super-admin/operations/types";
import { AiEmergencySection } from "@/features/super-admin/operations/AiEmergencySection";
import { AiIncidentHistorySection } from "@/features/super-admin/operations/AiIncidentHistorySection";
import { AiLiveMonitoringSection } from "@/features/super-admin/operations/AiLiveMonitoringSection";
import { AiOperationsAssistantSection } from "@/features/super-admin/operations/AiOperationsAssistantSection";
import { AiOperationsHeader } from "@/features/super-admin/operations/AiOperationsHeader";
import { AiOperationsLogsSection } from "@/features/super-admin/operations/AiOperationsLogsSection";
import { AiOperationsSummaryCards } from "@/features/super-admin/operations/AiOperationsSummaryCards";
import { AiPerformanceSection } from "@/features/super-admin/operations/AiPerformanceSection";
import { AiPlatformScanSection } from "@/features/super-admin/operations/AiPlatformScanSection";
import { AiRecommendationsSection } from "@/features/super-admin/operations/AiRecommendationsSection";
import { AiRepairCenterSection } from "@/features/super-admin/operations/AiRepairCenterSection";
import { AiSecuritySection } from "@/features/super-admin/operations/AiSecuritySection";
import { AiSelfHealingSection } from "@/features/super-admin/operations/AiSelfHealingSection";

import "@/styles/ai-operations.css";

type AiOperationsCenterProps = {
  initialSnapshot: AiOperationsSnapshot;
};

export function AiOperationsCenter({ initialSnapshot }: AiOperationsCenterProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  return (
    <div className="ai-ops-center space-y-ds-8 pb-ds-10">
      <AiOperationsHeader />
      <AiOperationsSummaryCards summary={snapshot.summary} />
      <AiPlatformScanSection snapshot={snapshot} onScanned={setSnapshot} />
      <AiRepairCenterSection snapshot={snapshot} onUpdated={setSnapshot} />
      <AiRecommendationsSection recommendations={snapshot.recommendations} />
      <AiLiveMonitoringSection services={snapshot.liveServices} />
      <AiSelfHealingSection
        settings={snapshot.settings}
        onUpdated={(settings) => setSnapshot((prev) => ({ ...prev, settings }))}
      />
      <AiIncidentHistorySection incidents={snapshot.incidents} />
      <AiPerformanceSection performance={snapshot.performance} />
      <AiSecuritySection security={snapshot.security} />
      <AiOperationsLogsSection logs={snapshot.logs} />
      <AiOperationsAssistantSection />
      <AiEmergencySection />
    </div>
  );
}
