"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { STAFF_ENTERPRISE_PLATFORMS } from "@/lib/staff-enterprise/constants";
import { useStaffCall } from "@/features/staff-enterprise/useStaffCall";
import { useStaffMessages } from "@/features/staff-enterprise/useStaffMessages";

type StaffSnapshot = {
  staffId: string;
  roleIds: string[];
  modules: string[];
  directory: Array<{
    staffId: string;
    fullName: string;
    department: string | null;
    position: string | null;
    presence: string;
    avatarUrl: string | null;
    lastActiveAt: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    roleIds: string[];
  }>;
  channels: Array<{
    channel_id: string;
    staff_channels: { name: string; channel_type: string } | null;
  }>;
};

type StaffEnterpriseShellProps = {
  initialTab?: "dashboard" | "directory" | "messages" | "calls";
};

const TABS = [
  { id: "dashboard", href: "/staff", label: "Dashboard" },
  { id: "directory", href: "/staff/directory", label: "Directory" },
  { id: "messages", href: "/staff/messages", label: "Messages" },
  { id: "calls", href: "/staff/calls", label: "Calls" },
] as const;

function presenceVariant(presence: string): "success" | "warning" | "default" {
  if (presence === "online") return "success";
  if (presence === "busy" || presence === "away") return "warning";
  return "default";
}

export function StaffEnterpriseShell({ initialTab = "dashboard" }: StaffEnterpriseShellProps) {
  const [tab, setTab] = useState(initialTab);
  const [snapshot, setSnapshot] = useState<StaffSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [callHistory, setCallHistory] = useState<Array<Record<string, unknown>>>([]);
  const [incomingCallId, setIncomingCallId] = useState<string | null>(null);

  const call = useStaffCall({
    staffId: snapshot?.staffId ?? "",
    onIncomingCall: (callId) => setIncomingCallId(callId),
  });

  const messaging = useStaffMessages(snapshot?.staffId ?? "", snapshot?.channels ?? []);

  async function registerDevice() {
    const platform =
      /Android/i.test(navigator.userAgent) ? "android" :
      /iPhone|iPad/i.test(navigator.userAgent) ? "ios" :
      /Windows/i.test(navigator.userAgent) ? "windows" : "web";

    await fetch("/api/staff-enterprise/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register_device",
        platform,
        deviceName: `${platform} — ${navigator.platform}`,
      }),
    });
  }

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/staff-enterprise");
      const payload = (await response.json()) as StaffSnapshot;
      setSnapshot(payload);
      setLoading(false);
      await fetch("/api/staff-enterprise", { method: "POST" });
      await registerDevice();
      const historyResponse = await fetch("/api/staff-enterprise/calls");
      const historyPayload = (await historyResponse.json()) as { history?: Array<Record<string, unknown>> };
      setCallHistory(historyPayload.history ?? []);
    })();
  }, []);

  if (loading) {
    return <p className="staff-enterprise__muted">Loading staff platform…</p>;
  }

  return (
    <div className="staff-enterprise">
      <header className="staff-enterprise__header">
        <div>
          <p className="staff-enterprise__eyebrow">ROVEXO Staff Enterprise</p>
          <h1>Staff Platform</h1>
          <p className="staff-enterprise__muted">Voice, video, messaging, and directory — unified account</p>
        </div>
        <nav className="staff-enterprise__nav" aria-label="Staff sections">
          {TABS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={tab === item.id ? "is-active" : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {incomingCallId ? (
        <Card padding="lg" className="staff-enterprise__incoming-call">
          <h2>Incoming call</h2>
          <div className="staff-enterprise__call-actions">
            <Button onClick={() => void call.answerCall(incomingCallId, false)}>Answer</Button>
            <Button variant="secondary" onClick={() => setIncomingCallId(null)}>Decline</Button>
          </div>
        </Card>
      ) : null}

      {call.activeCallId ? (
        <Card padding="lg" className="staff-enterprise__active-call">
          <h2>Active call</h2>
          <p className="staff-enterprise__muted">State: {call.callState}</p>
          <div className="staff-enterprise__call-actions">
            <Button variant="secondary" onClick={() => void call.toggleMute()}>{call.muted ? "Unmute" : "Mute"}</Button>
            <Button variant="secondary" onClick={() => void call.toggleVideo()}>{call.videoEnabled ? "Camera off" : "Camera on"}</Button>
            <Button variant="secondary" onClick={() => void call.toggleSpeaker()}>{call.speakerEnabled ? "Earpiece" : "Speaker"}</Button>
            <Button variant="secondary" onClick={() => call.startRecording()}>Record</Button>
            <Button onClick={() => void call.endCall()}>End call</Button>
          </div>
        </Card>
      ) : null}

      {tab === "dashboard" ? (
        <div className="staff-enterprise__grid">
          <Card padding="lg">
            <h2>Your Modules</h2>
            <div className="staff-enterprise__badges">
              {(snapshot?.modules ?? []).map((module) => (
                <Badge key={module} variant="default">{module}</Badge>
              ))}
            </div>
          </Card>
          <Card padding="lg">
            <h2>Supported Platforms</h2>
            <ul className="staff-enterprise__list">
              {STAFF_ENTERPRISE_PLATFORMS.map((platform) => (
                <li key={platform.id}>
                  <strong>{platform.label}</strong>
                  <span className="staff-enterprise__muted">{platform.distribution.join(" · ")}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card padding="lg">
            <h2>Presence</h2>
            <Badge variant="success">Online</Badge>
            {messaging.offline ? <Badge variant="warning">Offline queue active</Badge> : null}
          </Card>
        </div>
      ) : null}

      {tab === "directory" ? (
        <Card padding="none" className="staff-enterprise__directory">
          {(snapshot?.directory ?? []).map((member) => (
            <article key={member.staffId} className="staff-enterprise__directory-item">
              <div>
                <strong>{member.fullName}</strong>
                <p className="staff-enterprise__muted">
                  {[member.position, member.department, ...(member.roleIds ?? [])].filter(Boolean).join(" · ") || "Staff member"}
                </p>
                {member.companyPhone ? <p className="staff-enterprise__muted">{member.companyPhone}</p> : null}
              </div>
              <div className="staff-enterprise__directory-meta">
                <Badge variant={presenceVariant(member.presence)}>{member.presence}</Badge>
                <div className="staff-enterprise__call-actions">
                  <Button
                    size="sm"
                    onClick={() => void call.initiateCall([member.staffId], "voice")}
                    aria-label={`Call ${member.fullName}`}
                  >
                    Call
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void call.initiateCall([member.staffId], "video")}
                    aria-label={`Video call ${member.fullName}`}
                  >
                    Video
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void messaging.openDirectMessage(member.staffId)}
                    aria-label={`Chat with ${member.fullName}`}
                  >
                    Chat
                  </Button>
                  {member.companyEmail ? (
                    <a className="staff-enterprise__email-link" href={`mailto:${member.companyEmail}`} aria-label={`Email ${member.fullName}`}>
                      Email
                    </a>
                  ) : null}
                </div>
                {member.lastActiveAt ? (
                  <time dateTime={member.lastActiveAt}>{new Date(member.lastActiveAt).toLocaleString("en-GB")}</time>
                ) : null}
              </div>
            </article>
          ))}
        </Card>
      ) : null}

      {tab === "messages" ? (
        <div className="staff-enterprise__messages">
          <Card padding="none" className="staff-enterprise__channel-list">
            <ul className="staff-enterprise__list">
              {(snapshot?.channels ?? []).map((entry) => (
                <li key={entry.channel_id}>
                  <button
                    type="button"
                    className={messaging.activeChannelId === entry.channel_id ? "is-active" : undefined}
                    onClick={() => messaging.setActiveChannelId(entry.channel_id)}
                  >
                    <strong>{entry.staff_channels?.name ?? "Channel"}</strong>
                    <span className="staff-enterprise__muted">{entry.staff_channels?.channel_type}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card padding="lg" className="staff-enterprise__message-pane">
            <header className="staff-enterprise__message-header">
              <h2>{messaging.activeChannel?.staff_channels?.name ?? "Select a channel"}</h2>
              <input
                type="search"
                placeholder="Search messages…"
                value={messaging.searchQuery}
                onChange={(event) => messaging.setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void messaging.runSearch();
                }}
                aria-label="Search messages"
              />
            </header>
            {messaging.searchResults.length ? (
              <ul className="staff-enterprise__message-list">
                {messaging.searchResults.map((message) => (
                  <li key={message.id}>
                    <p>{message.body}</p>
                    <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("en-GB")}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="staff-enterprise__message-list" aria-live="polite">
                {messaging.messages.map((message) => (
                  <li key={message.id} className={message.sender_staff_id === snapshot?.staffId ? "is-self" : undefined}>
                    <p>{message.body}</p>
                    <div className="staff-enterprise__message-meta">
                      <time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString("en-GB")}</time>
                      <button type="button" onClick={() => void messaging.pinMessage(message.id)}>Pin</button>
                      <button type="button" onClick={() => void messaging.bookmarkMessage(message.id)}>Bookmark</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form
              className="staff-enterprise__composer"
              onSubmit={(event) => {
                event.preventDefault();
                void messaging.sendMessage();
              }}
            >
              <input
                type="file"
                aria-label="Attach file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void messaging.uploadFile(file);
                }}
              />
              <input
                type="text"
                value={messaging.draft}
                onChange={(event) => messaging.setDraft(event.target.value)}
                placeholder="Type a message… Use @ to mention"
                aria-label="Message body"
              />
              <Button type="submit">Send</Button>
            </form>
          </Card>
        </div>
      ) : null}

      {tab === "calls" ? (
        <div className="staff-enterprise__grid">
          <Card padding="lg">
            <h2>Voice &amp; Video</h2>
            <p className="staff-enterprise__muted">WebRTC calls with transfer, conference, recording, and Bluetooth/speaker controls via browser APIs.</p>
            <div className="staff-enterprise__call-actions">
              <Button onClick={() => void call.initiateCall([snapshot?.staffId ?? ""].filter(Boolean), "voice")}>Test voice</Button>
              <Button variant="secondary" onClick={() => void call.initiateCall([snapshot?.staffId ?? ""].filter(Boolean), "video")}>Test video</Button>
            </div>
          </Card>
          <Card padding="lg">
            <h2>Call history</h2>
            <ul className="staff-enterprise__list">
              {callHistory.map((entry) => (
                <li key={String(entry.call_id)}>
                  <strong>{String((entry.staff_call_sessions as { call_type?: string } | null)?.call_type ?? "call")}</strong>
                  <span className="staff-enterprise__muted">
                    {String((entry.staff_call_sessions as { status?: string } | null)?.status ?? "unknown")}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card padding="lg">
            <h2>Missed calls</h2>
            <ul className="staff-enterprise__list">
              {callHistory
                .filter((entry) => (entry.staff_call_sessions as { status?: string } | null)?.status === "missed")
                .map((entry) => (
                  <li key={String(entry.call_id)}>Missed call</li>
                ))}
            </ul>
          </Card>
        </div>
      ) : null}

      <footer className="staff-enterprise__footer">
        Administration: <Link href="/super-admin/staff">Super Admin Staff Profile &amp; Audit</Link>
      </footer>
    </div>
  );
}
