"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MyAccountTemplate } from "@/features/account-canonical";
import { SettingsMenuSections } from "@/features/account-module/components/SettingsMenuSections";
import { FailClosedPanel } from "@/components/fail-closed/FailClosedPanel";
import { resolveSettingsHubVisibility } from "@/lib/master-engine/settings";

type SettingsV1Props = {
  activeListingCount?: number;
  loadFailed?: boolean;
};

export function SettingsV1({ activeListingCount = 0, loadFailed = false }: SettingsV1Props) {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const [retryKey, setRetryKey] = useState(0);
  const visibility = resolveSettingsHubVisibility();

  if (loadFailed || !visibility.visible) {
    return (
      <MyAccountTemplate surface="settings" title="Settings" backHref="/account" showHeaderTitle>
        <FailClosedPanel
          density="section"
          onRetry={() => {
            setRetryKey((k) => k + 1);
            window.location.reload();
          }}
        />
      </MyAccountTemplate>
    );
  }

  return (
    <MyAccountTemplate surface="settings" title="Settings" backHref="/account" showHeaderTitle>
      <div key={retryKey} className="settings-canonical-v1" data-settings-hub="v1.0">
        <SettingsMenuSections returnTo={returnTo} activeListingCount={activeListingCount} />
      </div>
    </MyAccountTemplate>
  );
}
