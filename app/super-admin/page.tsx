import { CommandCenterLiveProvider } from "@/features/super-admin/command-center-v1/CommandCenterLiveProvider";
import { CommandCenterV1Live } from "@/features/super-admin/command-center-v1/CommandCenterV1";
import { getCommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1";

export default async function SuperAdminHomePage() {
  const snapshot = await getCommandCenterV1Snapshot();

  return (
    <CommandCenterLiveProvider initialSnapshot={snapshot}>
      <CommandCenterV1Live />
    </CommandCenterLiveProvider>
  );
}

export async function generateMetadata() {
  return {
    title: "Command Center | ROVEXO Super Admin",
    robots: { index: false, follow: false },
  };
}
