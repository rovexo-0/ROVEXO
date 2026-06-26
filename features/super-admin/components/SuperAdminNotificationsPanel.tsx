"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { NotificationDeliveryStats } from "@/lib/super-admin/notification-stats";

type BroadcastAudience = "all" | "sellers" | "businesses" | "buyers" | "admins";
type PreferenceCategory =
  | "orders"
  | "messages"
  | "payments"
  | "support"
  | "marketing"
  | "security"
  | "business"
  | "ai";

export function SuperAdminNotificationsPanel() {
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState<PreferenceCategory | "">("");
  const [stats, setStats] = useState<NotificationDeliveryStats | null>(null);

  useEffect(() => {
    void fetch("/api/super-admin/notifications/stats?days=30")
      .then((response) => response.json())
      .then((payload: { stats: NotificationDeliveryStats }) => setStats(payload.stats));
  }, []);

  async function runCommand(body: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch("/api/super-admin/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string; sent?: number; skipped?: number };
    if (response.ok) {
      const detail =
        payload.sent != null ? `Sent ${payload.sent}${payload.skipped ? `, skipped ${payload.skipped}` : ""}.` : "";
      setMessage(`Notification sent. ${detail}`.trim());
      const statsResponse = await fetch("/api/super-admin/notifications/stats?days=30");
      if (statsResponse.ok) {
        const statsPayload = (await statsResponse.json()) as { stats: NotificationDeliveryStats };
        setStats(statsPayload.stats);
      }
    } else {
      setMessage(payload.error ?? "Send failed.");
    }
  }

  return (
    <div className="space-y-ds-4">
      {stats ? (
        <Card padding="md" className="bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <h3 className="font-semibold">Delivery statistics (30 days)</h3>
          <div className="mt-ds-3 grid gap-ds-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-text-secondary">In-app created</p>
              <p className="text-lg font-semibold">{stats.notifications.total}</p>
            </div>
            <div>
              <p className="text-text-secondary">Unread / read</p>
              <p className="text-lg font-semibold">
                {stats.notifications.unread} / {stats.notifications.read}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Push sent / failed</p>
              <p className="text-lg font-semibold">
                {stats.delivery.byChannel.push?.sent ?? 0} / {stats.delivery.byChannel.push?.failed ?? 0}
              </p>
            </div>
            <div>
              <p className="text-text-secondary">Active subscriptions</p>
              <p className="text-lg font-semibold">{stats.push.subscriptions}</p>
            </div>
          </div>
        </Card>
      ) : null}

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
            onChange={(event) => setAudience(event.target.value as BroadcastAudience)}
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          >
            <option value="all">All users</option>
            <option value="buyers">Buyers</option>
            <option value="sellers">Sellers</option>
            <option value="businesses">Businesses</option>
            <option value="admins">Admins</option>
          </select>
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value.toUpperCase())}
            placeholder="Country code (optional, e.g. GB)"
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as PreferenceCategory | "")}
            className="premium-input min-h-ds-7 rounded-ds-md px-ds-3 text-sm"
          >
            <option value="">All categories</option>
            <option value="orders">Orders</option>
            <option value="messages">Messages</option>
            <option value="payments">Payments</option>
            <option value="support">Support</option>
            <option value="marketing">Marketing</option>
            <option value="security">Security</option>
            <option value="business">Business</option>
            <option value="ai">AI / saved search</option>
          </select>
          <div className="flex flex-wrap gap-ds-2">
            <Button
              onClick={() =>
                void runCommand({
                  action: "broadcast_notification",
                  title,
                  subtitle,
                  audience,
                  country: country || undefined,
                  category: category || undefined,
                  kind: "platform",
                })
              }
            >
              Platform broadcast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                void runCommand({
                  action: "send_category_notification",
                  title,
                  subtitle,
                  audience,
                  country: country || undefined,
                  category: category || undefined,
                })
              }
            >
              Category broadcast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                void runCommand({
                  action: "send_emergency_notification",
                  title,
                  subtitle,
                  audience,
                  country: country || undefined,
                })
              }
            >
              Emergency broadcast
            </Button>
          </div>
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
