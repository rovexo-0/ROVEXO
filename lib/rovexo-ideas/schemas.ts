import { z } from "zod";
import { ROVEXO_IDEA_STATUSES } from "@/lib/rovexo-ideas/types";

export const submitRovexoIdeaSchema = z.object({
  subject: z.string().trim().min(3, "Subject is required.").max(200),
  body: z.string().trim().min(10, "Please describe your idea.").max(5000),
});

export const updateRovexoIdeaStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ROVEXO_IDEA_STATUSES),
  adminNotes: z.string().max(2000).optional(),
});
