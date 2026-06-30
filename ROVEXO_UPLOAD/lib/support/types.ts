export type SupportCategory =
  | "account"
  | "buying"
  | "selling"
  | "payments"
  | "delivery"
  | "chat"
  | "technical"
  | "business"
  | "pro_seller"
  | "appeal_moderation"
  | "report_user"
  | "other";

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  category: SupportCategory;
  subject: string;
  description: string;
  attachmentUrls: string[];
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
};

export const SUPPORT_CATEGORIES: Array<{ id: SupportCategory; label: string }> = [
  { id: "account", label: "Account" },
  { id: "buying", label: "Buying" },
  { id: "selling", label: "Selling" },
  { id: "payments", label: "Payments" },
  { id: "delivery", label: "Delivery" },
  { id: "chat", label: "Chat" },
  { id: "technical", label: "Technical Issues" },
  { id: "business", label: "Business" },
  { id: "pro_seller", label: "Pro Seller" },
  { id: "appeal_moderation", label: "Appeal Moderation" },
  { id: "report_user", label: "Report User" },
  { id: "other", label: "Other" },
];

export const SUPPORT_SUCCESS_MESSAGE = {
  title: "Your request has been received successfully.",
  paragraphs: [
    "Due to the high number of enquiries we receive, response times may be significantly longer than usual.",
    "Some cases require additional investigation and may take several business days.",
    "Submitting multiple requests for the same issue will not speed up processing.",
    "Every request is reviewed individually.",
  ],
};
