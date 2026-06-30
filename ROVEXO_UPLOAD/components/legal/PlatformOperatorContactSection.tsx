import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  LEGAL_OPERATOR_NAME,
  LEGAL_SUPPORT_EMAIL,
  LEGAL_WEBSITE_URL,
} from "@/lib/legal/content";

export function PlatformOperatorContactSection() {
  return (
    <Card padding="lg">
      <h2 className="text-sm font-semibold text-text-primary">Platform operator</h2>
      <div className="mt-ds-3 space-y-ds-2 text-sm text-text-secondary">
        <p className="font-medium text-text-primary">{LEGAL_OPERATOR_NAME}</p>
        <p>
          <span className="font-medium text-text-primary">Website:</span>{" "}
          <Link
            href={LEGAL_WEBSITE_URL}
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {LEGAL_WEBSITE_URL}
          </Link>
        </p>
        <p>
          <span className="font-medium text-text-primary">Support:</span>{" "}
          <Link href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {LEGAL_SUPPORT_EMAIL}
          </Link>
        </p>
      </div>
    </Card>
  );
}
