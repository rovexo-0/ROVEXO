"use client";

import {
  CanonicalPageHeader,
  type CanonicalPageHeaderProps,
} from "@/components/navigation/CanonicalPageHeader";

export type CanonicalAccountHeaderProps = CanonicalPageHeaderProps;

/**
 * My Account subpage header — delegates to the platform account module header unchanged.
 */
export function CanonicalAccountHeader(props: CanonicalAccountHeaderProps) {
  return <CanonicalPageHeader {...props} />;
}
