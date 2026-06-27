import { Badge } from "@/components/ui/Badge";
import type { SellerReviewCaseStatus } from "@/lib/moderation/review-center";
import { statusColor } from "@/lib/moderation/review-center";

type ReviewStatusBadgeProps = {
  status: SellerReviewCaseStatus;
  label: string;
};

export function ReviewStatusBadge({ status, label }: ReviewStatusBadgeProps) {
  return <Badge variant={statusColor(status)}>{label}</Badge>;
}
