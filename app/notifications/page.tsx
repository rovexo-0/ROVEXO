import { redirect } from "next/navigation";
import { INBOX_ROUTES } from "@/lib/inbox/canonical-routes";

export const dynamic = "force-dynamic";

/** Legacy Notifications list → Inbox Notifications tab. */
export default function NotificationsRouteRedirect() {
  redirect(INBOX_ROUTES.notificationsTab);
}
