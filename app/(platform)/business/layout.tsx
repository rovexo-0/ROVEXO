import { redirect } from "next/navigation";
import {
  isV1BusinessUxRemoved,
  PHASE_C_V1_BUSINESS_CLEANUP_V1,
} from "@/lib/phase-c-v1-business-cleanup-v1";

/**
 * Phase C — all `/business/*` end-user routes redirect to Personal Account.
 * Business hub implementation remains on disk for v2.0 (isolated / inactive).
 */
export default function BusinessV1CleanupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isV1BusinessUxRemoved()) {
    redirect(PHASE_C_V1_BUSINESS_CLEANUP_V1.redirectBusinessRoutesTo);
  }
  return children;
}
