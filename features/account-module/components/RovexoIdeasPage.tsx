"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import "@/styles/rovexo/account-canonical-v2.css";

const IDEA_TABS = [
  { id: "ideas", label: "Ideas" },
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "following", label: "Following" },
  { id: "new", label: "New Idea", action: true },
] as const;

type IdeasTabId = (typeof IDEA_TABS)[number]["id"];

function isIdeasTab(value: string | null): value is IdeasTabId {
  return IDEA_TABS.some((tab) => tab.id === value);
}

export function RovexoIdeasPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: IdeasTabId = isIdeasTab(tabParam) ? tabParam : "ideas";
  const [searchQuery, setSearchQuery] = useState("");

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
      setMessage("Thank you. Your idea was submitted.");
    });
  };

  return (
    <AccountModuleShell title="Ideas" backHref="/account" version="v2.0-lock">
      <div className="ac-ideas-hub" data-rovexo-ideas-version="v2.0-lock">
        <nav className="ac-ideas-hub__tabs" aria-label="Ideas views">
          {IDEA_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.id === "ideas" ? "/account/ideas" : `/account/ideas?tab=${tab.id}`}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn("ac-ideas-hub__tab", "action" in tab && tab.action && "ac-ideas-hub__tab--action")}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <label className="sr-only" htmlFor="ideas-search">
          Search ideas
        </label>
        <input
          id="ideas-search"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search"
          className="ac-ideas-hub__search"
        />

        {activeTab === "new" ? (
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
              <span className="acm-ideas__label">Screenshot (optional)</span>
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
                {screenshotName ?? "Choose image"}
              </label>
            </div>

            {error ? <p className="acm-ideas__error">{error}</p> : null}
            {message ? <p className="acm-ideas__success">{message}</p> : null}

            <button type="submit" className={cn("acm-ideas__submit", focusRing)} disabled={isPending}>
              {isPending ? "Submitting…" : "Submit Idea"}
            </button>
          </form>
        ) : (
          <p className="ac-ideas-hub__empty">
            {searchQuery.trim()
              ? `No ideas match “${searchQuery.trim()}”.`
              : "Propose improvements for ROVEXO. Like, comment, and follow ideas from the community."}
          </p>
        )}
      </div>
    </AccountModuleShell>
  );
}
