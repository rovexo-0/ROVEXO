"use client";

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { subscribeStaffMessages, subscribeStaffTyping } from "@/lib/staff-comms/webrtc-client";

type Channel = {
  channel_id: string;
  staff_channels: { name: string; channel_type: string } | null;
};

type Message = {
  id: string;
  body: string;
  sender_staff_id: string;
  created_at: string;
  message_type?: string;
};

export function useStaffMessages(staffId: string, channels: Channel[]) {
  const [activeChannelId, setActiveChannelId] = useState<string | null>(channels[0]?.channel_id ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typingNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [offline, setOffline] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeChannel = useMemo(
    () => channels.find((entry) => entry.channel_id === activeChannelId) ?? null,
    [activeChannelId, channels],
  );

  const loadMessages = useCallback(async (channelId: string) => {
    const response = await fetch(`/api/staff-enterprise/messages?channelId=${channelId}`);
    const payload = (await response.json()) as { messages?: Message[] };
    setMessages(payload.messages ?? []);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!activeChannelId || !draft.trim()) return;
    const body = draft.trim();
    setDraft("");

    if (!navigator.onLine) {
      await fetch("/api/staff-enterprise/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "send_message", payload: { channelId: activeChannelId, body } }),
      });
      return;
    }

    await fetch("/api/staff-enterprise/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", channelId: activeChannelId, body }),
    });
  }, [activeChannelId, draft]);

  const markRead = useCallback(async (messageId: string) => {
    await fetch("/api/staff-enterprise/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", messageId }),
    });
  }, []);

  const pinMessage = useCallback(
    async (messageId: string) => {
      if (!activeChannelId) return;
      await fetch("/api/staff-enterprise/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", channelId: activeChannelId, messageId }),
      });
    },
    [activeChannelId],
  );

  const bookmarkMessage = useCallback(async (messageId: string) => {
    await fetch("/api/staff-enterprise/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bookmark", messageId }),
    });
  }, []);

  const openDirectMessage = useCallback(async (targetStaffId: string) => {
    const response = await fetch("/api/staff-enterprise/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open_dm", targetStaffId }),
    });
    const payload = (await response.json()) as { channelId?: string };
    if (payload.channelId) setActiveChannelId(payload.channelId);
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!activeChannelId) return;
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") {
            reject(new Error("Failed to read file."));
            return;
          }
          resolve(result.split(",")[1] ?? "");
        };
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      await fetch("/api/staff-enterprise/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeChannelId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          contentBase64,
        }),
      });
      await loadMessages(activeChannelId);
    },
    [activeChannelId, loadMessages],
  );

  const runSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const response = await fetch(`/api/staff-enterprise/messages?q=${encodeURIComponent(searchQuery.trim())}`);
    const payload = (await response.json()) as { results?: Message[] };
    setSearchResults(payload.results ?? []);
  }, [searchQuery]);

  useEffect(() => {
    const syncOffline = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) void fetch("/api/staff-enterprise/offline");
    };
    syncOffline();
    window.addEventListener("online", syncOffline);
    window.addEventListener("offline", syncOffline);
    return () => {
      window.removeEventListener("online", syncOffline);
      window.removeEventListener("offline", syncOffline);
    };
  }, []);

  useEffect(() => {
    if (!activeChannelId) return;
    startTransition(() => {
      void loadMessages(activeChannelId);
    });
    const messageChannel = subscribeStaffMessages(activeChannelId, (row) => {
      setMessages((current) => [...current, row as unknown as Message]);
      void markRead(String(row.id));
    });
    const typingChannel = subscribeStaffTyping(activeChannelId, () => {
      void fetch(`/api/staff-enterprise/messages?channelId=${activeChannelId}`);
    });

    return () => {
      messageChannel?.unsubscribe();
      typingChannel?.unsubscribe();
    };
  }, [activeChannelId, loadMessages, markRead]);

  useEffect(() => {
    if (!activeChannelId) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    void fetch("/api/staff-enterprise/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "typing", channelId: activeChannelId, typing: Boolean(draft) }),
    });
    typingTimer.current = setTimeout(() => {
      void fetch("/api/staff-enterprise/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "typing", channelId: activeChannelId, typing: false }),
      });
    }, 3000);
  }, [activeChannelId, draft]);

  return {
    staffId,
    channels,
    activeChannelId,
    setActiveChannelId,
    activeChannel,
    messages,
    draft,
    setDraft,
    typingNames,
    searchQuery,
    setSearchQuery,
    searchResults,
    offline,
    sendMessage,
    pinMessage,
    bookmarkMessage,
    openDirectMessage,
    uploadFile,
    runSearch,
  };
}
