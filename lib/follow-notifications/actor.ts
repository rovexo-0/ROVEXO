import "server-only";

import { tryCreateAdminClient } from "@/lib/supabase/admin";

export type FollowNotificationActor = {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string | null;
};

/** Resolve display fields for notification copy — not Follow relationship data. */
export async function resolveFollowNotificationActor(
  userId: string,
): Promise<FollowNotificationActor> {
  const admin = tryCreateAdminClient();
  if (!admin) {
    return { id: userId, name: "Someone", avatarUrl: null };
  }
  try {
    const { data } = await admin
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (!data) {
      return { id: userId, name: "Someone", avatarUrl: null };
    }
    const name =
      (typeof data.full_name === "string" && data.full_name.trim()) ||
      (typeof data.username === "string" && data.username.trim()) ||
      "Someone";
    return {
      id: userId,
      name,
      username: typeof data.username === "string" ? data.username : undefined,
      avatarUrl: typeof data.avatar_url === "string" ? data.avatar_url : null,
    };
  } catch {
    return { id: userId, name: "Someone", avatarUrl: null };
  }
}
