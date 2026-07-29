"use client";

import {
  CanonicalSection,
  CanonicalMenuRow,
  CanonicalButton,
  CanonicalInfoBlock,
  CanonicalInput,
  CanonicalTextarea,
} from "@/src/components/canonical";
import { useId, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { MyAccountTemplate, AccountPageStack } from "@/features/account-canonical";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { ROVEXO_IDEAS_DOM, ROVEXO_IDEAS_MENU_TITLE } from "@/lib/rovexo-ideas/rovexo-ideas-v1-lock";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

const IDEA_TABS = [
  { id: "ideas", label: "Ideas" },
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "following", label: "Following" },
  { id: "new", label: "New Idea" },
] as const;

type IdeasTabId = (typeof IDEA_TABS)[number]["id"];

function isIdeasTab(value: string | null): value is IdeasTabId {
  return IDEA_TABS.some((tab) => tab.id === value);
}

/**
 * Rovexo Ideas v1.0 — Profile design inheritance via MyAccountTemplate.
 * Menu entry: Profile → Settings → Rovexo Ideas → Help → Legal.
 */
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
    <MyAccountTemplate
      surface="ideas"
      title={ROVEXO_IDEAS_MENU_TITLE}
      backHref="/account"
      showHeaderTitle
    >
      <div data-rovexo-ideas-version={ROVEXO_IDEAS_DOM} data-full-width-surface="ideas">
        <AccountPageStack className="fw-engine__stack" aria-label={ROVEXO_IDEAS_MENU_TITLE}>
          <CanonicalSection title="Browse">
            <div className="fw-engine__group">
              {IDEA_TABS.map((tab) => (
                <CanonicalMenuRow
                  key={tab.id}
                  title={tab.label}
                  href={tab.id === "ideas" ? "/account/ideas" : `/account/ideas?tab=${tab.id}`}
                  value={activeTab === tab.id ? "Selected" : undefined}
                />
              ))}
            </div>
          </CanonicalSection>

          <CanonicalSection title="Search">
            <CanonicalInput
              id="ideas-search"
              inputType="search"
              label="Search ideas"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
            />
          </CanonicalSection>

          {activeTab === "new" ? (
            <CanonicalSection title="Submit idea">
              <form className="flex w-full flex-col gap-ds-4" onSubmit={handleSubmit}>
                <CanonicalInput
                  id="idea-subject"
                  label="Subject"
                  name="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  maxLength={200}
                  disabled={isPending}
                />
                <CanonicalTextarea
                  id="idea-body"
                  label="Your Idea"
                  name="body"
                  rows={6}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  required
                  maxLength={5000}
                  disabled={isPending}
                />
                <div className="cds-field w-full">
                  <span className="cds-field__label">Screenshot (optional)</span>
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
                    className={cn(
                      "cds-button cds-button--outline cds-button--full mt-ds-2",
                      focusRing,
                      isPending && "pointer-events-none opacity-50",
                    )}
                  >
                    {screenshotName ?? "Choose image"}
                  </label>
                </div>

                {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
                {message ? <CanonicalInfoBlock variant="success">{message}</CanonicalInfoBlock> : null}

                <CanonicalButton type="submit" fullWidth loading={isPending}>
                  {isPending ? "Submitting…" : "Submit Idea"}
                </CanonicalButton>
              </form>
            </CanonicalSection>
          ) : (
            <CanonicalInfoBlock variant="description">
              {searchQuery.trim()
                ? `No ideas match “${searchQuery.trim()}”.`
                : "Share ideas with the Rovexo Ideas community. You can submit, search, follow, discuss, and share. ROVEXO decides prioritisation and releases."}
            </CanonicalInfoBlock>
          )}
        </AccountPageStack>
      </div>
    </MyAccountTemplate>
  );
}
