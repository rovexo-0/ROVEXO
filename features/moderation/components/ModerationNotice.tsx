import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { ModerationUserNotice } from "@/lib/moderation/user-messages";

type ModerationNoticeProps = {
  notice: ModerationUserNotice;
};

const actionClassName =
  "inline-flex min-h-ds-6 items-center justify-center rounded-ds-full px-ds-4 text-sm font-medium";

export function ModerationNotice({ notice }: ModerationNoticeProps) {
  return (
    <Card padding="md" className="border-warning/30 bg-warning/5 shadow-ds-soft">
      <h3 className="text-sm font-semibold text-text-primary">{notice.title}</h3>
      <p className="mt-ds-2 text-sm text-text-secondary">{notice.message}</p>
      <div className="mt-ds-3 flex flex-wrap gap-ds-2">
        {notice.editListingHref ? (
          <Link href={notice.editListingHref} className={`${actionClassName} bg-primary text-white`}>
            Edit Listing
          </Link>
        ) : null}
        <Link href={notice.requestReviewHref} className={`${actionClassName} border border-border bg-surface`}>
          Request Review
        </Link>
        <Link href={notice.learnMoreHref} className={`${actionClassName} text-text-primary`}>
          Learn More
        </Link>
      </div>
    </Card>
  );
}
