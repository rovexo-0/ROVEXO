import { CommandCenterLiveProvider } from "@/features/super-admin/command-center-v1/CommandCenterLiveProvider";
import { CommandCenterV2Live } from "@/features/super-admin/command-center-v2/CommandCenterV2";
import { getCommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1";

export default async function SuperAdminHomePage() {
  const snapshot = await getCommandCenterV1Snapshot();

  return (
    <CommandCenterLiveProvider initialSnapshot={snapshot}>
      <CommandCenterV2Live />
    </CommandCenterLiveProvider>
  );
}

export async function generateMetadata() {
  return {
    title: "Command Center | ROVEXO Super Admin",
    robots: { index: false, follow: false },
  };
}
