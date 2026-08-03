import { Card } from "@/components/ui/Card";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminCouponsPage() {
  return (
    <>
      <SuperAdminPageHeader title="Coupons" description="Discount codes and promotional coupons." />
      <Card padding="md">
        <p className="text-sm text-text-secondary">
          Create and manage marketplace coupon codes from this centre.
        </p>
      </Card>
    </>
  );
}
