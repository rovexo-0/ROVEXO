import { MessagesInboxV1 } from "@/features/messages/components/MessagesInboxV1";

export const dynamic = "force-dynamic";

export default function MessagesRoute() {
  return <MessagesInboxV1 />;
}

export async function generateMetadata() {
  return {
    title: "Messages | ROVEXO",
    description: "ROVEXO Messages — secure marketplace communication and real-time chat.",
    robots: { index: false, follow: false },
  };
}
