import { MessagesListPage } from "@/features/messages/components/MessagesListPage";
import { fetchConversations } from "@/lib/messages/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function MessagesRoute() {
  const conversations = await fetchConversations();

  return <MessagesListPage conversations={conversations} />;
}
