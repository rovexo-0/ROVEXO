import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminReviewsPage() {
  return (
    <>
      <SuperAdminPageHeader title="Reviews" description="Product review moderation and insights." />
      <Card padding="md">
        <p className="text-sm text-text-secondary">
          Centralised review moderation is rolling out in the next platform release.
        </p>
      </Card>
    </>
  );
}
