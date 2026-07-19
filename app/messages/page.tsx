import { redirect } from "next/navigation";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export const dynamic = "force-dynamic";

/**
 * Absolute Final — Transaction Hub lives at /inbox.
 * /messages permanently redirects to Inbox (messages tab).
 */
export default function MessagesRoute() {
  redirect(INBOX_ROUTES.messagesTab);
}
