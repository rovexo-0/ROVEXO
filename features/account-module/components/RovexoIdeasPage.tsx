"use client";

import { useRef, useState, useTransition } from "react";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export function RovexoIdeasPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("subject", subject);
      formData.set("body", body);
      const file = fileRef.current?.files?.[0];
      if (file) {
        formData.set("screenshot", file);
      }

      const response = await fetch("/api/account/ideas", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        setError(payload.error ?? "Unable to send your suggestion.");
        return;
      }

      setSubject("");
      setBody("");
      setScreenshotName(null);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      setMessage("Thank you. Your suggestion was sent privately to the ROVEXO Team.");
    });
  };

  return (
    <AccountModuleShell title="ROVEXO Ideas" backHref="/account" version="v2.1">
      <div className="acm-ideas" data-rovexo-ideas-version="v2.1">
        <p className="acm-ideas__intro">
          Have an idea? Share your suggestion to help improve ROVEXO and create a better experience
          for everyone.
        </p>

        <form className="acm-ideas__form" onSubmit={handleSubmit}>
          <label className="acm-ideas__field">
            <span className="acm-ideas__label">Subject</span>
            <input
              type="text"
              name="subject"
              className="acm-ideas__input"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={200}
              disabled={isPending}
            />
          </label>

          <label className="acm-ideas__field">
            <span className="acm-ideas__label">Your Idea</span>
            <textarea
              name="body"
              className="acm-ideas__textarea"
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={5000}
              disabled={isPending}
            />
          </label>

          <div className="acm-ideas__field">
            <span className="acm-ideas__label">Add Screenshot (Optional)</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="rovexo-idea-screenshot"
              disabled={isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                setScreenshotName(file?.name ?? null);
              }}
            />
            <button
              type="button"
              className={cn("acm-ideas__attach", focusRing)}
              disabled={isPending}
              onClick={() => fileRef.current?.click()}
            >
              📎 {screenshotName ?? "Choose image"}
            </button>
          </div>

          {error ? <p className="acm-ideas__error">{error}</p> : null}
          {message ? <p className="acm-ideas__success">{message}</p> : null}

          <button type="submit" className={cn("acm-ideas__submit", focusRing)} disabled={isPending}>
            {isPending ? "Sending…" : "Send Suggestion"}
          </button>
        </form>
      </div>
    </AccountModuleShell>
  );
}
