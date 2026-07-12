import { redirect } from "next/navigation";
import { TRANSACTION_HUB_INBOX_PATH } from "@/lib/transaction-hub/inbox-routes";

type InboxRedirectProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy `/inbox` alias — canonical inbox lives at `/messages`. */
export default async function InboxRedirect({ searchParams }: InboxRedirectProps) {
  const params = await searchParams;
  const thread = params.thread;

  if (typeof thread === "string" && thread.trim()) {
    redirect(`${TRANSACTION_HUB_INBOX_PATH}/${thread.trim()}`);
  }

  redirect(TRANSACTION_HUB_INBOX_PATH);
}
