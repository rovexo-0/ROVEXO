"use client";

import Link from "next/link";
import { RovexoSignOutLink } from "@/components/auth/RovexoSignOutLink";

export function SellerFooterActions() {
  return (
    <div className="seller-footer-actions">
      <Link href="/sell/new" className="seller-footer-actions__link">
        Add listing
      </Link>
      <Link href="/buyer" className="seller-footer-actions__link seller-footer-actions__link--muted">
        Switch to buyer dashboard
      </Link>
      <RovexoSignOutLink />
    </div>
  );
}