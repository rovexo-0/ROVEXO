import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileUpdateInput } from "@/lib/account/schemas";
import { sanitizeOptionalText, sanitizeText } from "@/lib/account/sanitize";

export type ProfileDetails = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  verified: boolean;
  bio: string | null;
  emailVerified: boolean;
};

export async function getProfileDetails(userId: string): Promise<ProfileDetails | null> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: profile }, { data: seller }, authUser] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("seller_profiles").select("bio").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  if (!profile) return null;

  const row = profile as { phone?: string | null; stripe_customer_id?: string | null };

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    phone: row.phone ?? null,
    verified: profile.verified,
    bio: seller?.bio ?? null,
    emailVerified: Boolean(authUser.data.user?.email_confirmed_at),
  };
}

export async function updateProfileDetails(
  userId: string,
  input: ProfileUpdateInput,
): Promise<ProfileDetails> {
  const supabase = await createClient();
  const updates: Record<string, string | null> = {};

  if (input.fullName != null) {
    updates.full_name = sanitizeText(input.fullName);
  }
  if (input.username != null) {
    updates.username = sanitizeText(input.username).toLowerCase();
  }
  if (input.phone !== undefined) {
    updates.phone = sanitizeOptionalText(input.phone) ?? null;
  }

  if (Object.keys(updates).length) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(updates.full_name != null ? { full_name: updates.full_name } : {}),
        ...(updates.username != null ? { username: updates.username } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      })
      .eq("id", userId);
    if (error) {
      if (error.code === "23505") {
        throw new Error("Username is already taken.");
      }
      throw error;
    }
  }

  if (input.bio !== undefined) {
    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (seller) {
      await supabase
        .from("seller_profiles")
        .update({ bio: sanitizeOptionalText(input.bio) ?? null })
        .eq("id", userId);
    }
  }

  const next = await getProfileDetails(userId);
  if (!next) {
    throw new Error("Profile not found");
  }
  return next;
}

export async function updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) throw error;
}
