"use client";

/**
 * ROVEXO MY ACCOUNT MASTER TEMPLATE v1.0 (PERMANENT LOCK)
 *
 * PROFILE → MyAccountTemplate → Header / Spacing / Button / Card / Typography /
 * Responsive / Full Width engines → MY ACCOUNT v1.0
 *
 * All My Account pages MUST inherit this template.
 * Forbidden: page-local design systems, paddings, headers, or button sizes.
 */

import { AccountCanonicalShell, type AccountCanonicalShellProps } from "@/features/account-canonical/shell/AccountCanonicalShell";
import { MY_ACCOUNT_V1_DOM, MY_ACCOUNT_V1_MASTER_PAGE } from "@/lib/design-system/my-account-v1";
import { cn } from "@/lib/cn";

export type MyAccountTemplateProps = AccountCanonicalShellProps & {
  /** Optional surface id for QA (e.g. addresses, security). */
  surface?: string;
};

/**
 * Single master template for every My Account page.
 * One change to Profile tokens / Full Width Engine updates all inheriting pages.
 */
export function MyAccountTemplate({
  className,
  contentClassName,
  surface,
  ...props
}: MyAccountTemplateProps) {
  return (
    <AccountCanonicalShell
      {...props}
      className={cn("my-account-template", className)}
      contentClassName={cn("my-account-template__content", contentClassName)}
      dataMyAccountTemplate={MY_ACCOUNT_V1_DOM}
      dataMyAccountMaster={MY_ACCOUNT_V1_MASTER_PAGE}
      dataMyAccountSurface={surface}
    />
  );
}
