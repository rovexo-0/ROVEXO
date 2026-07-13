import { redirect } from "next/navigation";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export const dynamic = "force-dynamic";

/** Legacy Messages list → canonical Inbox. */
export default function MessagesRouteRedirect() {
  redirect(INBOX_ROUTES.hub);
}
