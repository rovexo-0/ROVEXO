import { createClient } from "@/lib/supabase/server";

export type BlockedUser = {
  id: string;
  blockedUserId: string;
  username: string;
  fullName: string;
  createdAt: string;
};

type BlockRow = {
  id: string;
  blocked_user_id: string;
  created_at: string;
};

export async function listBlockedUsers(userId: string): Promise<BlockedUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_blocks")
    .select("id, blocked_user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as BlockRow[];
  if (!rows.length) return [];

  const blockedIds = rows.map((row) => row.blocked_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", blockedIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return rows.map((row) => {
    const profile = profileMap.get(row.blocked_user_id);
    return {
      id: row.id,
      blockedUserId: row.blocked_user_id,
      username: profile?.username ?? "unknown",
      fullName: profile?.full_name ?? "Unknown user",
      createdAt: row.created_at,
    };
  });
}

export async function blockUserByUsername(userId: string, username: string): Promise<BlockedUser> {
  const supabase = await createClient();
  const normalized = username.trim().toLowerCase();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("username", normalized)
    .maybeSingle();

  if (!target) {
    throw new Error("User not found.");
  }

  if (target.id === userId) {
    throw new Error("You cannot block yourself.");
  }

  const { data: existing } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("user_id", userId)
    .eq("blocked_user_id", target.id)
    .maybeSingle();

  if (existing) {
    throw new Error("User is already blocked.");
  }

  const { data, error } = await supabase
    .from("user_blocks")
    .insert({ user_id: userId, blocked_user_id: target.id })
    .select("id, blocked_user_id, created_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    blockedUserId: data.blocked_user_id,
    username: target.username,
    fullName: target.full_name,
    createdAt: data.created_at,
  };
}

export async function unblockUser(userId: string, blockId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("id", blockId)
    .eq("user_id", userId);

  if (error) throw error;
}
