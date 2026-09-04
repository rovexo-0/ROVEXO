import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { ProfileUpdateInput } from "@/lib/account/schemas";
import { sanitizeOptionalText, sanitizeText } from "@/lib/account/sanitize";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";

export type ProfileDetails = {
  id: string;
  email: string;
  role: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  phone: string | null;
  verified: boolean;
  bio: string | null;
  emailVerified: boolean;
  dateOfBirth: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  verified: boolean;
  role: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
};

/**
 * Load account profile details.
 * Fail closed locally: never throw for missing SERVICE_ROLE / env / partial reads.
 * Prefer admin when available; otherwise user-scoped createClient().
 */
export async function getProfileDetails(userId: string): Promise<ProfileDetails | null> {
  try {
    const supabase = await createClient();
    const admin = tryCreateAdminClient();
    const profileClient = admin ?? supabase;

    const profileQuery = profileClient
      .from("profiles")
      .select("id, username, full_name, avatar_url, cover_url, verified, role, phone, email, date_of_birth")
      .eq("id", userId)
      .maybeSingle();

    const sellerQuery = supabase.from("seller_profiles").select("bio").eq("id", userId).maybeSingle();

    if (admin) {
      const [{ data: profile }, { data: seller }, authUser] = await Promise.all([
        profileQuery,
        sellerQuery,
        admin.auth.admin.getUserById(userId).catch(() => ({ data: { user: null } })),
      ]);

      if (!profile) return null;
      return mapProfileDetails(profile as ProfileRow, seller?.bio ?? null, {
        email: authUser.data.user?.email,
        emailVerified: Boolean(authUser.data.user?.email_confirmed_at),
      });
    }

    const [{ data: profile }, { data: seller }, auth] = await Promise.all([
      profileQuery,
      sellerQuery,
      supabase.auth.getUser().catch(() => ({ data: { user: null } })),
    ]);

    if (!profile) return null;

    const sessionUser = auth.data.user?.id === userId ? auth.data.user : null;
    return mapProfileDetails(profile as ProfileRow, seller?.bio ?? null, {
      email: sessionUser?.email ?? undefined,
      emailVerified: Boolean(sessionUser?.email_confirmed_at),
    });
  } catch {
    // Missing ENV, network, or partial provider failure — never crash the page.
    return null;
  }
}

function mapProfileDetails(
  profile: ProfileRow,
  bio: string | null,
  auth: { email?: string | null; emailVerified: boolean },
): ProfileDetails {
  return {
    id: profile.id,
    email: auth.email ?? profile.email ?? "",
    role: profile.role,
    fullName: profile.full_name,
    username: profile.username,
    avatarUrl: normalizeAvatarUrl(profile.avatar_url),
    coverUrl: normalizeAvatarUrl(profile.cover_url),
    phone: profile.phone ?? null,
    verified: profile.verified,
    bio,
    emailVerified: auth.emailVerified,
    dateOfBirth: profile.date_of_birth ?? null,
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
  if (input.dateOfBirth !== undefined) {
    updates.date_of_birth = input.dateOfBirth.trim() ? input.dateOfBirth.trim() : null;
  }

  if (Object.keys(updates).length) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(updates.full_name != null ? { full_name: updates.full_name } : {}),
        ...(updates.username != null ? { username: updates.username } : {}),
        ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        ...(updates.date_of_birth !== undefined ? { date_of_birth: updates.date_of_birth } : {}),
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
    const bio = sanitizeOptionalText(input.bio) ?? null;
    const { error } = await supabase.from("seller_profiles").upsert(
      { id: userId, bio },
      { onConflict: "id" },
    );
    if (error) {
      throw new Error("Unable to save bio.");
    }
  }

  const next = await getProfileDetails(userId);
  if (!next) {
    throw new Error("Profile not found");
  }
  return next;
}

export async function updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
  // Prefer service-role when present; otherwise user-scoped client (no ENV crash).
  const admin = tryCreateAdminClient();
  const client = admin ?? (await createClient());
  const { error } = await client
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (error) throw error;
}


export async function updateCoverUrl(userId: string, coverUrl: string | null): Promise<void> {
  const admin = tryCreateAdminClient();
  const client = admin ?? (await createClient());
  const { error } = await client
    .from("profiles")
    .update({ cover_url: coverUrl })
    .eq("id", userId);

  if (error) throw error;
}
