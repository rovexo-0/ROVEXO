/**
 * Client push cleanup on logout — revoke browser PushSubscription + DELETE API.
 * Call before auth signOut so the session can authorize the DELETE.
 */

import { unsubscribeFromBrowserPush } from "@/lib/push/client-subscribe";
import { logPushPermissionFlow } from "@/lib/push/push-permission-flow-log-v1";

export async function cleanupPushSubscriptionOnLogout(): Promise<void> {
  try {
    await unsubscribeFromBrowserPush();
    logPushPermissionFlow("LOGOUT_PUSH_CLEANUP_OK", {});
  } catch (error) {
    logPushPermissionFlow("LOGOUT_PUSH_CLEANUP_ERROR", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
