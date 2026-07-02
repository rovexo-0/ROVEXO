"use client";

import Link from "next/link";
import type { SuperAdminBreadcrumb } from "@/lib/super-admin/premium/types";

type SuperAdminBreadcrumbsProps = {
  items: SuperAdminBreadcrumb[];
};

export function SuperAdminBreadcrumbs({ items }: SuperAdminBreadcrumbsProps) {
  if (items.length <= 1) return null;

  return (
    <nav className="sa-premium-breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="sa-premium-breadcrumbs__item">
            {index > 0 ? <span className="sa-premium-breadcrumbs__sep" aria-hidden>/</span> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="sa-premium-breadcrumbs__link">
                {item.label}
              </Link>
            ) : (
              <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
