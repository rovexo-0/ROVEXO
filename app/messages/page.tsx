import { Suspense } from "react";
import { MessagesEngineHub } from "@/features/messages-engine/MessagesEngineHub";
import { MESSAGES_ENGINE_MODULES } from "@/lib/messages-engine/registry";
import {
  getMessagesEngineAnalyticsForUser,
  getMessagesEngineContext,
  getPublicMessagesEngineConfig,
  listMessagesEngineSummaries,
} from "@/lib/messages-engine/reader";
import { fetchConversations } from "@/lib/messages/queries";
import { getProfile } from "@/lib/profile/data";

export default async function MessagesRoute() {
  const profile = await getProfile();
  const [config, context, summaries, analytics, conversations] = await Promise.all([
    getPublicMessagesEngineConfig(),
    getMessagesEngineContext(profile.id),
    listMessagesEngineSummaries(profile.id),
    getMessagesEngineAnalyticsForUser(profile.id),
    fetchConversations(),
  ]);

  return (
    <Suspense fallback={<div className="me-hub p-ds-5">Loading messages…</div>}>
      <MessagesEngineHub
        config={config}
        context={context}
        modules={MESSAGES_ENGINE_MODULES}
        summaries={summaries}
        analytics={analytics}
        conversations={conversations}
      />
    </Suspense>
  );
}

export async function generateMetadata() {
  return {
    title: "Messages | ROVEXO",
    description: "ROVEXO Messages Engine — secure marketplace communication, attachments, and real-time chat.",
    robots: { index: false, follow: false },
  };
}
