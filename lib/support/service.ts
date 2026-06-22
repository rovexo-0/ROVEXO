import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types/database";
import type { SupportCategory, SupportTicket } from "@/lib/support/types";
import type { SupportHelpContext } from "@/lib/help/types";

type CreateTicketInput = {
  userId: string;
  category: SupportCategory;
  subject: string;
  description: string;
  attachmentUrls?: string[];
  helpContext?: SupportHelpContext;
};

function mapTicket(row: Record<string, unknown>): SupportTicket {
  return {
    id: String(row.id),
    ticketNumber: String(row.ticket_number),
    category: row.category as SupportCategory,
    subject: String(row.subject),
    description: String(row.description),
    attachmentUrls: (row.attachment_urls as string[]) ?? [],
    status: row.status as SupportTicket["status"],
    createdAt: String(row.created_at),
  };
}

export async function createSupportTicket(input: CreateTicketInput): Promise<SupportTicket | null> {
  const admin = createAdminClient();
  const { data: ticketNumber } = await admin.rpc("generate_support_ticket_number");

  const { data, error } = await admin
    .from("support_tickets")
    .insert({
      user_id: input.userId,
      ticket_number: ticketNumber ?? `SUP-${Date.now().toString(36).toUpperCase()}`,
      category: input.category,
      subject: input.subject,
      description: input.description,
      attachment_urls: input.attachmentUrls ?? [],
      help_context: (input.helpContext ?? {}) as Json,
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  return mapTicket(data as Record<string, unknown>);
}

export async function listSupportTickets(userId: string): Promise<SupportTicket[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return ((data as Record<string, unknown>[] | null) ?? []).map(mapTicket);
}
