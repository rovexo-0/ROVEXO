import { LiveAnalyticsCenter } from "@/features/super-admin/live-analytics/LiveAnalyticsCenter";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export const metadata = {
  title: "Live Visitors",
};

export default function SuperAdminVisitorsPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Live Analytics Center"
        description="Enterprise realtime visitor intelligence — countries, devices, traffic, events, and platform performance."
      />
      <LiveAnalyticsCenter />
    </>
  );
}
