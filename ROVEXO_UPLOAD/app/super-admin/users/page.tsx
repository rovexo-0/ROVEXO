import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { SuperAdminUsersPanel } from "@/features/super-admin/components/SuperAdminUsersPanel";

type UsersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SuperAdminUsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  return (
    <>
      <SuperAdminPageHeader
        title="User Management"
        description="Search, suspend, verify, reset passwords, and manage roles for every account."
      />
      <SuperAdminUsersPanel initialQuery={params.q ?? ""} />
    </>
  );
}
