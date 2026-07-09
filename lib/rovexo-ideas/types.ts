export const ROVEXO_IDEA_STATUSES = [
  "new",
  "under_review",
  "planned",
  "in_development",
  "implemented",
  "closed",
] as const;

export type RovexoIdeaStatus = (typeof ROVEXO_IDEA_STATUSES)[number];

export type RovexoIdea = {
  id: string;
  userId: string;
  subject: string;
  body: string;
  screenshotUrl: string | null;
  status: RovexoIdeaStatus;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type RovexoIdeaWithUser = RovexoIdea & {
  userEmail: string | null;
  userName: string | null;
};

export const ROVEXO_IDEA_STATUS_LABELS: Record<RovexoIdeaStatus, string> = {
  new: "New",
  under_review: "Under Review",
  planned: "Planned",
  in_development: "In Development",
  implemented: "Implemented",
  closed: "Closed",
};
