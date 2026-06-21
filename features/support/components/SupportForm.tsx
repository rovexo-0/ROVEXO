"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SUPPORT_CATEGORIES } from "@/lib/support/types";

export function SupportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") ?? "account");
  const [subject, setSubject] = useState(
    searchParams.get("listing") ? `Appeal moderation — ${searchParams.get("listing")}` : "",
  );
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const attachmentUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadResponse = await fetch("/api/support/upload", { method: "POST", body: formData });
        const uploadPayload = (await uploadResponse.json()) as { path?: string; error?: string };
        if (!uploadResponse.ok || !uploadPayload.path) {
          setError(uploadPayload.error ?? "Attachment upload failed.");
          return;
        }
        attachmentUrls.push(uploadPayload.path);
      }

      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject,
          description,
          attachmentUrls,
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string; ticketNumber?: string };
      if (!response.ok || !payload.success) {
        setError(payload.error ?? "Unable to submit support request.");
        return;
      }

      router.push(`/support/success?ticket=${encodeURIComponent(payload.ticketNumber ?? "")}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="lg" className="shadow-ds-soft">
      <div className="grid gap-ds-4">
        <div>
          <label htmlFor="support-category" className="text-sm font-medium text-text-primary">
            Category
          </label>
          <select
            id="support-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-ds-1 w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-2 text-sm"
          >
            {SUPPORT_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="support-subject" className="text-sm font-medium text-text-primary">
            Subject
          </label>
          <input
            id="support-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-ds-1 w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="support-description" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="support-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            className="mt-ds-1 w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="support-attachments" className="text-sm font-medium text-text-primary">
            Attachments
          </label>
          <input
            id="support-attachments"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            className="mt-ds-1 block w-full text-sm"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button disabled={submitting || !subject.trim() || !description.trim()} onClick={() => void submit()}>
          Submit request
        </Button>
      </div>
    </Card>
  );
}
