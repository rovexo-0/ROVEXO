import Link from "next/link";
import {
  LEGAL_OPERATOR_NAME,
  LEGAL_SUPPORT_EMAIL,
  LEGAL_WEBSITE_URL,
} from "@/lib/legal/content";

export function LegalInformationSection() {
  return (
    <div className="space-y-ds-4 text-sm leading-relaxed text-text-secondary">
      <p className="text-base font-semibold text-text-primary">Legal Information</p>

      <p>
        ROVEXO is owned and operated by {LEGAL_OPERATOR_NAME}.
      </p>

      <p>
        {LEGAL_OPERATOR_NAME} is a company registered in England and Wales.
      </p>

      <p>
        ROVEXO is an online marketplace connecting buyers and sellers.
      </p>

      <p>
        Payments are securely processed using Stripe.
      </p>

      <p>
        Independent sellers are responsible for the products and services they offer through the platform.
      </p>

      <div className="space-y-ds-1 border-t border-border pt-ds-4">
        <p>
          <span className="font-medium text-text-primary">Support:</span>{" "}
          <Link href={`mailto:${LEGAL_SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {LEGAL_SUPPORT_EMAIL}
          </Link>
        </p>
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
      </div>
    </div>
  );
}
