export const ROVEXO_IDEA_STATUSES = [
  "new",
  "under_review",
  "planned",
  "in_development",
  "implemented",
  "closed",
] as const;

export type RovexoIdeaStatus = (typeof ROVEXO_IDEA_STATUSES)[number];

export const ROVEXO_IDEA_CATEGORIES = [
  "Buying",
  "Selling",
  "Payments",
  "Shipping",
  "Account",
  "Search",
  "Other",
] as const;

export type RovexoIdeaCategory = (typeof ROVEXO_IDEA_CATEGORIES)[number];

export type RovexoIdeaVote = "like" | "dislike" | null;

export type RovexoIdea = {
  id: string;
  userId: string;
  subject: string;
  body: string;
  screenshotUrl: string | null;
  category: RovexoIdeaCategory;
  status: RovexoIdeaStatus;
  adminNotes: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  followCount: number;
  createdAt: string;
  updatedAt: string;
};

export type RovexoIdeaWithUser = RovexoIdea & {
  userEmail: string | null;
  userName: string | null;
  userAvatarUrl?: string | null;
};

export type RovexoIdeaCommunityCard = RovexoIdeaWithUser & {
  myVote: RovexoIdeaVote;
  following: boolean;
  communityApproval: number;
  updates: RovexoIdeaUpdate[];
  comments: RovexoIdeaComment[];
};

export type RovexoIdeaComment = {
  id: string;
  ideaId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userAvatarUrl: string | null;
  likeCount?: number;
};

export type RovexoIdeaUpdate = {
  id: string;
  ideaId: string;
  status: RovexoIdeaStatus;
  message: string;
  createdAt: string;
};

export type RovexoIdeasStats = {
  submitted: number;
  underReview: number;
  planned: number;
  inDevelopment: number;
  released: number;
};

export type RovexoIdeasFilter =
  | "top"
  | "latest"
  | "under_review"
  | "planned"
  | "released"
  | "declined";

/** User-facing badge labels (Owner mockup). */
export const ROVEXO_IDEA_STATUS_LABELS: Record<RovexoIdeaStatus, string> = {
  new: "Pending Review",
  under_review: "Under Review",
  planned: "Planned",
  in_development: "In Development",
  implemented: "Released",
  closed: "Declined",
};

export const ROVEXO_IDEA_STATUS_SHORT: Record<RovexoIdeaStatus, string> = {
  new: "Pending",
  under_review: "Under Review",
  planned: "Planned",
  in_development: "In Dev.",
  implemented: "Released",
  closed: "Declined",
};

export function communityApprovalPercent(likes: number, dislikes: number): number {
  const total = likes + dislikes;
  if (total <= 0) return 0;
  return Math.round((likes / total) * 100);
}
