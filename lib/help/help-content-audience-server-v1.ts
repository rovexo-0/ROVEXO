/**
 * Server-only Help/Legal audience resolver.
 * Authority: session (guest vs signed-in) + loadActiveSellerContext(userId).
 */

import "server-only";

import { getAuthContext } from "@/lib/auth/session";
import { loadActiveSellerContext } from "@/lib/business/business-onboarding-v1";
import {
  resolveHelpContentAudiencesForSellerContext,
  type HelpContentAudience,
} from "@/lib/help/help-content-audience-v1";

/**
 * ONE resolver for Help pages, Help search, Legal visibility, and future APIs.
 */
export async function resolveViewerHelpAudiences(): Promise<readonly HelpContentAudience[]> {
  const auth = await getAuthContext();
  const userId = auth?.user?.id;
  if (!userId) {
    return resolveHelpContentAudiencesForSellerContext(null);
  }
  const sellerContext = await loadActiveSellerContext(userId);
  return resolveHelpContentAudiencesForSellerContext(sellerContext);
}
