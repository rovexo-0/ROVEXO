import { MessagesEngineAdmin } from "@/features/super-admin/messages-engine/MessagesEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMessagesEngineSnapshot } from "@/lib/messages-engine/reader";

export default async function SuperAdminMessagesEnginePage() {
  const snapshot = await getMessagesEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Messages Engine"
        description="Enterprise communication system — conversations, attachments, moderation, search, and integrations."
      />
      <MessagesEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Messages Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
