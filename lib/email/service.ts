import { createAdminClient } from "@/lib/supabase/admin";

type QueueEmailInput = {
  to: string;
  subject: string;
  body: string;
  template?: string;
  metadata?: Record<string, string>;
};

const MAX_RETRIES = 5;

async function sendViaProvider(input: QueueEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "ROVEXO <orders@rovexo.com>";

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, error: text.slice(0, 500) };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Send failed" };
  }
}

export async function queueEmail(input: QueueEmailInput): Promise<void> {
  if (!input.to.trim()) {
    return;
  }

  const admin = createAdminClient();
  await admin.from("email_outbox").insert({
    recipient_email: input.to.trim(),
    subject: input.subject,
    body_text: input.body,
    template: input.template ?? null,
    metadata: input.metadata ?? {},
    status: "pending",
    retry_count: 0,
  });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<void> {
  await queueEmail({
    to: input.to,
    subject: "Reset your ROVEXO password",
    body: `Reset your password using this link (expires soon):\n\n${input.resetUrl}\n\nIf you did not request this, ignore this email.`,
    template: "password_reset",
  });
}

function nextRetryAt(retryCount: number): string {
  const minutes = Math.min(60, 2 ** retryCount);
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export async function sendQueuedEmails(limit = 25): Promise<{ sent: number; failed: number }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const [{ data: pendingRows }, { data: retryRows }] = await Promise.all([
    admin
      .from("email_outbox")
      .select("id, recipient_email, subject, body_text, template, metadata, retry_count, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit),
    admin
      .from("email_outbox")
      .select("id, recipient_email, subject, body_text, template, metadata, retry_count, status")
      .eq("status", "failed")
      .lt("retry_count", MAX_RETRIES)
      .lte("next_retry_at", now)
      .order("created_at", { ascending: true })
      .limit(limit),
  ]);

  const rows = [...(pendingRows ?? []), ...(retryRows ?? [])].slice(0, limit);

  if (!rows.length) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const result = await sendViaProvider({
      to: row.recipient_email,
      subject: row.subject,
      body: row.body_text,
      template: row.template ?? undefined,
      metadata: (row.metadata as Record<string, string> | null) ?? undefined,
    });

    if (result.ok) {
      await admin
        .from("email_outbox")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    const retryCount = (row.retry_count ?? 0) + 1;
    const exhausted = retryCount >= MAX_RETRIES;

    await admin
      .from("email_outbox")
      .update({
        status: exhausted ? "failed" : "pending",
        retry_count: retryCount,
        last_error: result.error ?? "Send failed",
        next_retry_at: exhausted ? null : nextRetryAt(retryCount),
      })
      .eq("id", row.id);

    failed += 1;
  }

  return { sent, failed };
}
