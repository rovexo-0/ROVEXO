"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain current platform health issues",
  "Summarize critical scan findings",
  "Suggest SQL index improvements",
  "Generate an API route for health checks",
  "Explain recent authentication errors",
];

export function AiOperationsAssistantSection() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "AI Operations Assistant ready. I can explain issues, logs, stack traces, and generate fixes, migrations, SQL, API routes, and components.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/super-admin/operations/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Assistant request failed.");
      setMessages((prev) => [...prev, { role: "assistant", content: payload.reply ?? "No response." }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Assistant unavailable.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ai-ops-section">
      <h2 className="text-lg font-semibold text-text-primary">AI Assistant</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">
        Super Admin assistant with full operations context across the codebase.
      </p>

      <Card padding="md" className="premium-card ai-ops-assistant mt-ds-4 border border-primary/20">
        <div className="flex max-h-80 flex-col gap-ds-3 overflow-y-auto pr-ds-1">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-ds-lg px-ds-4 py-ds-3 text-sm ${
                message.role === "user"
                  ? "ml-auto max-w-[85%] bg-primary text-primary-foreground"
                  : "mr-auto max-w-[90%] bg-surface-muted text-text-primary"
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>

        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-ds-md border border-border bg-white/80 px-ds-2 py-ds-1 text-xs text-text-secondary hover:border-primary/40 hover:text-primary dark:bg-slate-900/80"
              onClick={() => void sendMessage(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form
          className="mt-ds-4 flex gap-ds-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about issues, logs, performance, security, or request generated code…"
            className="premium-input min-h-11 flex-1 rounded-ds-lg border border-border bg-white/90 px-ds-4 text-sm dark:bg-slate-900/80"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Thinking…" : "Send"}
          </Button>
        </form>
      </Card>
    </section>
  );
}
