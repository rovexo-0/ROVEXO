"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function SuperAdminNotificationsPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [audience, setAudience] = useState<"all" | "sellers" | "businesses">("all");

  async function runCommand(body: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch("/api/super-admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Notification sent." : payload.error ?? "Send failed.");
  }

  return (
    <div className="space-y-ds-4">
      <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h3 className="font-semibold">Broadcast notification</h3>
        <div className="mt-ds-3 grid gap-ds-3">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <textarea
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Message"
            rows={3}
            className="premium-input rounded-ds-md px-ds-3 py-ds-2 text-sm"
          />
          <select
            value={audience}
            onChange={(event) => setAudience(event.target.value as typeof audience)}
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          >
            <option value="all">All users</option>
            <option value="sellers">Sellers</option>
            <option value="businesses">Businesses</option>
          </select>
          <Button
            onClick={() =>
              void runCommand({
                action: "broadcast_notification",
                title,
                subtitle,
                audience,
              })
            }
          >
            Send broadcast
          </Button>
        </div>
      </Card>

      <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h3 className="font-semibold">Direct notification</h3>
        <div className="mt-ds-3 grid gap-ds-3 md:grid-cols-2">
          <input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User ID"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm md:col-span-2"
          />
          <Button
            variant="secondary"
            onClick={() =>
              void runCommand({
                action: "send_push_notification",
                userId,
                title,
                subtitle,
              })
            }
          >
            Send push
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              void runCommand({
                action: "send_email_notification",
                userId,
                title,
                subtitle,
              })
            }
          >
            Send email
          </Button>
        </div>
      </Card>

      {message ? <p className="text-sm font-medium text-primary">{message}</p> : null}
    </div>
  );
}
