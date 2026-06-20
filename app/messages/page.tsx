import { MessagesListPage } from "@/features/messages/components/MessagesListPage";
import { fetchConversations } from "@/lib/messages/queries";

export default async function MessagesRoute() {
  const conversations = await fetchConversations();

  return <MessagesListPage conversations={conversations} />;
}
