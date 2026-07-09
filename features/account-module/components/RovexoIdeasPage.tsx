"use client";

import { useId, useState, useTransition } from "react";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export function RovexoIdeasPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const screenshotInputId = useId();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("subject", subject);
      formData.set("body", body);
      if (screenshotFile) {
        formData.set("screenshot", screenshotFile);
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
      setScreenshotFile(null);
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
            <NativeImageFileInput
              id={screenshotInputId}
              disabled={isPending}
              onFilesSelected={(files) => {
                const file = files[0] ?? null;
                setScreenshotFile(file);
                setScreenshotName(file?.name ?? null);
              }}
            />
            <label
              htmlFor={screenshotInputId}
              className={cn("acm-ideas__attach", focusRing, isPending && "pointer-events-none opacity-50")}
            >
              📎 {screenshotName ?? "Choose image"}
            </label>
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
