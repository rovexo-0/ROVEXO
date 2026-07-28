import { FAIL_CLOSED_COPY } from "@/lib/fail-closed/constants";
import { coerceUserSafeText } from "@/lib/fail-closed/sanitize";

export function BuyerErrorState({ message }: { message?: string }) {
  const safe = coerceUserSafeText(message) || FAIL_CLOSED_COPY.body;
  return (
    <div className="buyer-empty" role="status" data-fail-closed="buyer-v1">
      <p className="buyer-empty__title">{FAIL_CLOSED_COPY.title}</p>
      <p className="buyer-empty__message">{safe}</p>
      <p className="buyer-empty__message">{FAIL_CLOSED_COPY.hint}</p>
    </div>
  );
}
