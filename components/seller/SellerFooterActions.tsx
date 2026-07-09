"use client";

import Link from "next/link";
import { RovexoSignOutLink } from "@/components/auth/RovexoSignOutLink";

export function SellerFooterActions() {
  return (
    <div className="seller-footer-actions">
      <Link href="/sell/new" className="seller-footer-actions__link">
        Add listing
      </Link>
      <Link href="/orders" className="seller-footer-actions__link seller-footer-actions__link--muted">
        Orders
      </Link>
      <RovexoSignOutLink />
    </div>
  );
}