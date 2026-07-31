import { z } from "zod";
import { ROVEXO_IDEA_CATEGORIES, ROVEXO_IDEA_STATUSES } from "@/lib/rovexo-ideas/types";

export const submitRovexoIdeaSchema = z.object({
  subject: z.string().trim().min(3, "Title is required.").max(200),
  body: z.string().trim().min(10, "Please describe your idea.").max(5000),
  category: z.enum(ROVEXO_IDEA_CATEGORIES).default("Buying"),
});

export const updateRovexoIdeaStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ROVEXO_IDEA_STATUSES),
  adminNotes: z.string().max(2000).optional(),
});

export const voteRovexoIdeaSchema = z.object({
  ideaId: z.string().uuid(),
  vote: z.enum(["like", "dislike", "none"]),
});

export const commentRovexoIdeaSchema = z.object({
  ideaId: z.string().uuid(),
  body: z.string().trim().min(1, "Write a comment.").max(2000),
});

export const editCommentSchema = z.object({
  commentId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

export const followRovexoIdeaSchema = z.object({
  ideaId: z.string().uuid(),
  follow: z.boolean(),
});

export const listIdeasQuerySchema = z.object({
  filter: z
    .enum(["top", "latest", "under_review", "planned", "released", "declined"])
    .default("top"),
  q: z.string().trim().max(120).optional().default(""),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});
