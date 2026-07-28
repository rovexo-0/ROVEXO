import { FAIL_CLOSED_COPY } from "@/lib/fail-closed/constants";
import { coerceUserSafeText } from "@/lib/fail-closed/sanitize";

export function SellerErrorState({ message }: { message?: string }) {
  const safe = coerceUserSafeText(message) || FAIL_CLOSED_COPY.body;
  return (
    <div className="seller-empty" role="status" data-fail-closed="seller-v1">
      <p className="seller-empty__title">{FAIL_CLOSED_COPY.title}</p>
      <p className="seller-empty__message">{safe}</p>
      <p className="seller-empty__message">{FAIL_CLOSED_COPY.hint}</p>
    </div>
  );
}
