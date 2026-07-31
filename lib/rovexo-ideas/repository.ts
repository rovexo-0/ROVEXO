import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  communityApprovalPercent,
  type RovexoIdea,
  type RovexoIdeaCategory,
  type RovexoIdeaComment,
  type RovexoIdeaCommunityCard,
  type RovexoIdeasFilter,
  type RovexoIdeasStats,
  type RovexoIdeaStatus,
  type RovexoIdeaUpdate,
  type RovexoIdeaVote,
  type RovexoIdeaWithUser,
} from "@/lib/rovexo-ideas/types";

type IdeaRow = {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  screenshot_url: string | null;
  category: string;
  status: RovexoIdeaStatus;
  admin_notes: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  follow_count: number;
  created_at: string;
  updated_at: string;
};

type IdeaWithProfileRow = IdeaRow & {
  profiles: {
    email: string | null;
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
};

const IDEA_SELECT =
  "id, user_id, subject, body, screenshot_url, category, status, admin_notes, like_count, dislike_count, comment_count, follow_count, created_at, updated_at";

function mapCategory(value: string | null | undefined): RovexoIdeaCategory {
  const allowed: RovexoIdeaCategory[] = [
    "Buying",
    "Selling",
    "Payments",
    "Shipping",
    "Account",
    "Search",
    "Other",
  ];
  return allowed.includes(value as RovexoIdeaCategory)
    ? (value as RovexoIdeaCategory)
    : "Other";
}

function mapIdea(row: IdeaRow): RovexoIdea {
  return {
    id: row.id,
    userId: row.user_id,
    subject: row.subject,
    body: row.body,
    screenshotUrl: row.screenshot_url,
    category: mapCategory(row.category),
    status: row.status,
    adminNotes: row.admin_notes,
    likeCount: row.like_count ?? 0,
    dislikeCount: row.dislike_count ?? 0,
    commentCount: row.comment_count ?? 0,
    followCount: row.follow_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWithUser(row: IdeaWithProfileRow): RovexoIdeaWithUser {
  return {
    ...mapIdea(row),
    userEmail: row.profiles?.email ?? null,
    userName: row.profiles?.full_name ?? null,
    userAvatarUrl: row.profiles?.avatar_url ?? null,
  };
}

export async function createRovexoIdea(input: {
  userId: string;
  subject: string;
  body: string;
  category?: RovexoIdeaCategory;
  screenshotUrl?: string | null;
}): Promise<RovexoIdea> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rovexo_ideas")
    .insert({
      user_id: input.userId,
      subject: input.subject,
      body: input.body,
      category: input.category ?? "Buying",
      screenshot_url: input.screenshotUrl ?? null,
    })
    .select(IDEA_SELECT)
    .single();

  if (error || !data) {
    throw new Error("Unable to send your suggestion. Please try again.");
  }

  const idea = mapIdea(data as IdeaRow);

  // Seed pending-review timeline (service role — users cannot write updates)
  try {
    const admin = createAdminClient();
    await admin.from("rovexo_idea_updates").insert({
      idea_id: idea.id,
      status: "new",
      message: "Idea submitted and waiting for review.",
      created_by: input.userId,
    });
  } catch {
    // Non-blocking — idea already persisted
  }

  return idea;
}

export async function getRovexoIdeasStats(): Promise<RovexoIdeasStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rovexo_ideas")
    .select("status");

  if (error) {
    throw new Error("Unable to load idea stats.");
  }

  const rows = data ?? [];
  return {
    submitted: rows.length,
    underReview: rows.filter((r) => r.status === "under_review").length,
    planned: rows.filter((r) => r.status === "planned").length,
    inDevelopment: rows.filter((r) => r.status === "in_development").length,
    released: rows.filter((r) => r.status === "implemented").length,
  };
}

export async function listCommunityIdeas(input: {
  userId: string;
  filter: RovexoIdeasFilter;
  query?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ ideas: RovexoIdeaCommunityCard[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const limit = input.limit ?? 20;

  let query = supabase
    .from("rovexo_ideas")
    .select(
      `${IDEA_SELECT}, profiles!rovexo_ideas_user_id_fkey ( email, full_name, avatar_url )`,
    )
    .limit(limit + 1);

  if (input.filter === "under_review") query = query.eq("status", "under_review");
  if (input.filter === "planned") query = query.eq("status", "planned");
  if (input.filter === "released") query = query.eq("status", "implemented");
  if (input.filter === "declined") query = query.eq("status", "closed");

  if (input.filter === "top") {
    query = query.order("like_count", { ascending: false }).order("created_at", {
      ascending: false,
    });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (input.cursor) {
    query = query.lt("created_at", input.cursor);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load ideas.");
  }

  let rows = (data ?? []) as IdeaWithProfileRow[];
  const normalizedQuery = input.query?.trim().toLowerCase();
  if (normalizedQuery) {
    rows = rows.filter((row) => {
      const haystack = [row.subject, row.body, row.category, row.profiles?.full_name ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const ideaIds = page.map((r) => r.id);

  const [votesRes, followsRes, updatesRes, commentsRes] = await Promise.all([
    ideaIds.length
      ? supabase
          .from("rovexo_idea_votes")
          .select("idea_id, vote")
          .eq("user_id", input.userId)
          .in("idea_id", ideaIds)
      : Promise.resolve({ data: [] as { idea_id: string; vote: string }[] }),
    ideaIds.length
      ? supabase
          .from("rovexo_idea_follows")
          .select("idea_id")
          .eq("user_id", input.userId)
          .in("idea_id", ideaIds)
      : Promise.resolve({ data: [] as { idea_id: string }[] }),
    ideaIds.length
      ? supabase
          .from("rovexo_idea_updates")
          .select("id, idea_id, status, message, created_at")
          .in("idea_id", ideaIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({
          data: [] as {
            id: string;
            idea_id: string;
            status: string;
            message: string;
            created_at: string;
          }[],
        }),
    ideaIds.length
      ? supabase
          .from("rovexo_idea_comments")
          .select(
            "id, idea_id, user_id, body, created_at, updated_at, profiles!rovexo_idea_comments_user_id_fkey ( full_name, avatar_url )",
          )
          .in("idea_id", ideaIds)
          .order("created_at", { ascending: false })
          .limit(120)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const voteMap = new Map(
    (votesRes.data ?? []).map((v) => [v.idea_id, v.vote as "like" | "dislike"]),
  );
  const followSet = new Set((followsRes.data ?? []).map((f) => f.idea_id));
  const updatesByIdea = new Map<string, RovexoIdeaUpdate[]>();
  for (const u of updatesRes.data ?? []) {
    const list = updatesByIdea.get(u.idea_id) ?? [];
    list.push({
      id: u.id,
      ideaId: u.idea_id,
      status: u.status as RovexoIdeaStatus,
      message: u.message,
      createdAt: u.created_at,
    });
    updatesByIdea.set(u.idea_id, list);
  }

  const commentsByIdea = new Map<string, RovexoIdeaComment[]>();
  for (const raw of (commentsRes.data ?? []) as Array<{
    id: string;
    idea_id: string;
    user_id: string;
    body: string;
    created_at: string;
    updated_at: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  }>) {
    const list = commentsByIdea.get(raw.idea_id) ?? [];
    list.push({
      id: raw.id,
      ideaId: raw.idea_id,
      userId: raw.user_id,
      body: raw.body,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      userName: raw.profiles?.full_name ?? null,
      userAvatarUrl: raw.profiles?.avatar_url ?? null,
    });
    commentsByIdea.set(raw.idea_id, list);
  }

  const ideas: RovexoIdeaCommunityCard[] = page.map((row) => {
    const base = mapWithUser(row);
    const myVote = (voteMap.get(row.id) ?? null) as RovexoIdeaVote;
    return {
      ...base,
      myVote,
      following: followSet.has(row.id),
      communityApproval: communityApprovalPercent(base.likeCount, base.dislikeCount),
      updates: updatesByIdea.get(row.id) ?? [],
      comments: (commentsByIdea.get(row.id) ?? []).slice(0, 3),
    };
  });

  const nextCursor = hasMore ? page[page.length - 1]?.created_at ?? null : null;
  return { ideas, nextCursor };
}

export async function findSimilarIdeas(input: {
  query: string;
  limit?: number;
}): Promise<Array<{ id: string; subject: string; status: RovexoIdeaStatus }>> {
  const q = input.query.trim();
  if (q.length < 3) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rovexo_ideas")
    .select("id, subject, status")
    .ilike("subject", `%${q}%`)
    .order("like_count", { ascending: false })
    .limit(input.limit ?? 5);

  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    subject: row.subject,
    status: row.status as RovexoIdeaStatus,
  }));
}

export async function setIdeaVote(input: {
  userId: string;
  ideaId: string;
  vote: "like" | "dislike" | "none";
}): Promise<{ likeCount: number; dislikeCount: number; myVote: RovexoIdeaVote }> {
  const supabase = await createClient();

  if (input.vote === "none") {
    await supabase
      .from("rovexo_idea_votes")
      .delete()
      .eq("idea_id", input.ideaId)
      .eq("user_id", input.userId);
  } else {
    const { error } = await supabase.from("rovexo_idea_votes").upsert(
      {
        idea_id: input.ideaId,
        user_id: input.userId,
        vote: input.vote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "idea_id,user_id" },
    );
    if (error) throw new Error("Unable to save your vote.");
  }

  const { data } = await supabase
    .from("rovexo_ideas")
    .select("like_count, dislike_count")
    .eq("id", input.ideaId)
    .single();

  return {
    likeCount: data?.like_count ?? 0,
    dislikeCount: data?.dislike_count ?? 0,
    myVote: input.vote === "none" ? null : input.vote,
  };
}

export async function setIdeaFollow(input: {
  userId: string;
  ideaId: string;
  follow: boolean;
}): Promise<{ followCount: number; following: boolean }> {
  const supabase = await createClient();
  if (input.follow) {
    const { error } = await supabase.from("rovexo_idea_follows").upsert(
      { idea_id: input.ideaId, user_id: input.userId },
      { onConflict: "idea_id,user_id" },
    );
    if (error) throw new Error("Unable to follow this idea.");
  } else {
    await supabase
      .from("rovexo_idea_follows")
      .delete()
      .eq("idea_id", input.ideaId)
      .eq("user_id", input.userId);
  }

  const { data } = await supabase
    .from("rovexo_ideas")
    .select("follow_count")
    .eq("id", input.ideaId)
    .single();

  return {
    followCount: data?.follow_count ?? 0,
    following: input.follow,
  };
}

export async function addIdeaComment(input: {
  userId: string;
  ideaId: string;
  body: string;
}): Promise<RovexoIdeaComment> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rovexo_idea_comments")
    .insert({
      idea_id: input.ideaId,
      user_id: input.userId,
      body: input.body,
    })
    .select(
      "id, idea_id, user_id, body, created_at, updated_at, profiles!rovexo_idea_comments_user_id_fkey ( full_name, avatar_url )",
    )
    .single();

  if (error || !data) throw new Error("Unable to post comment.");

  const row = data as {
    id: string;
    idea_id: string;
    user_id: string;
    body: string;
    created_at: string;
    updated_at: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  };

  return {
    id: row.id,
    ideaId: row.idea_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userName: row.profiles?.full_name ?? null,
    userAvatarUrl: row.profiles?.avatar_url ?? null,
  };
}

export async function editIdeaComment(input: {
  userId: string;
  commentId: string;
  body: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rovexo_idea_comments")
    .update({ body: input.body, updated_at: new Date().toISOString() })
    .eq("id", input.commentId)
    .eq("user_id", input.userId);
  if (error) throw new Error("Unable to edit comment.");
}

export async function deleteIdeaComment(input: {
  userId: string;
  commentId: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("rovexo_idea_comments")
    .delete()
    .eq("id", input.commentId)
    .eq("user_id", input.userId);
  if (error) throw new Error("Unable to delete comment.");
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
      `${IDEA_SELECT}, profiles!rovexo_ideas_user_id_fkey ( email, full_name, avatar_url )`,
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
    .map(mapWithUser)
    .filter((idea) => {
      if (!normalizedQuery) return true;
      const haystack = [
        idea.subject,
        idea.body,
        idea.userEmail ?? "",
        idea.userName ?? "",
        idea.category,
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
    .select(IDEA_SELECT)
    .single();

  if (error || !data) {
    throw new Error("Unable to update suggestion status.");
  }

  return mapIdea(data as IdeaRow);
}
