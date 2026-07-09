import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { RovexoIdea, RovexoIdeaStatus, RovexoIdeaWithUser } from "@/lib/rovexo-ideas/types";

type IdeaRow = {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  screenshot_url: string | null;
  status: RovexoIdeaStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
};

type IdeaWithProfileRow = IdeaRow & {
  profiles: { email: string | null; full_name: string | null } | null;
};

function mapIdea(row: IdeaRow): RovexoIdea {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    body: row.body,
    screenshotUrl: row.screenshot_url,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createRovexoIdea(input: {
  userId: string;
  subject: string;
  body: string;
  screenshotUrl?: string | null;
}): Promise<RovexoIdea> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rovexo_ideas")
    .insert({
      user_id: input.userId,
      subject: input.subject,
      body: input.body,
      screenshot_url: input.screenshotUrl ?? null,
    })
    .select(
      "id, user_id, subject, body, screenshot_url, status, admin_notes, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to send your suggestion. Please try again.");
  }

  return mapIdea(data as IdeaRow);
}

export async function listRovexoIdeasForAdmin(input?: {
  query?: string;
  status?: RovexoIdeaStatus | "all";
  limit?: number;
}): Promise<RovexoIdeaWithUser[]> {
  const admin = createAdminClient();
  let query = admin
    .from("rovexo_ideas")
    .select(
      "id, user_id, subject, body, screenshot_url, status, admin_notes, created_at, updated_at, profiles!rovexo_ideas_user_id_fkey ( email, full_name )",
    )
    .order("created_at", { ascending: false })
    .limit(input?.limit ?? 200);

  if (input?.status && input.status !== "all") {
    query = query.eq("status", input.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load ROVEXO Ideas.");
  }

  const rows = (data ?? []) as IdeaWithProfileRow[];
  const normalizedQuery = input?.query?.trim().toLowerCase();

  return rows
    .map((row) => ({
      ...mapIdea(row),
      userEmail: row.profiles?.email ?? null,
      userName: row.profiles?.full_name ?? null,
    }))
    .filter((idea) => {
      if (!normalizedQuery) return true;
      const haystack = [
        idea.subject,
        idea.body,
        idea.userEmail ?? "",
        idea.userName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
}

export async function updateRovexoIdeaStatus(input: {
  id: string;
  status: RovexoIdeaStatus;
  adminNotes?: string;
}): Promise<RovexoIdea> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rovexo_ideas")
    .update({
      status: input.status,
      ...(input.adminNotes !== undefined ? { admin_notes: input.adminNotes } : {}),
    })
    .eq("id", input.id)
    .select(
      "id, user_id, subject, body, screenshot_url, status, admin_notes, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error("Unable to update suggestion status.");
  }

  return mapIdea(data as IdeaRow);
}
