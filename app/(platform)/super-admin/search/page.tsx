import { SuperAdminGlobalSearch } from "@/features/super-admin/components/SuperAdminGlobalSearch";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";

export default function SuperAdminSearchPage() {
  return (
    <>
      <SuperAdminPageHeader
        title="Global Search"
        description="Search users, listings, businesses, payments, orders, reports, and messages."
      />
      <SuperAdminGlobalSearch />
    </>
  );
}
