import { redirect } from "next/navigation";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export const dynamic = "force-dynamic";

type ChatRouteProps = {
  params: Promise<{ id: string }>;
};

/** Legacy chat deep-link → Inbox conversation placeholder (Sprint 2). */
export default async function ChatRouteRedirect({ params }: ChatRouteProps) {
  const { id } = await params;
  redirect(INBOX_ROUTES.conversation(id));
}
