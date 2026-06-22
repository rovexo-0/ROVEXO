"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function RfqSubmitForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [categorySlug, setCategorySlug] = useState("");
  const [premium, setPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/wholesale/rfq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          quantity: Number(quantity),
          categorySlug: categorySlug || undefined,
          premium,
        }),
      });
      if (!response.ok) {
        setError("Unable to submit RFQ.");
        return;
      }
      setTitle("");
      setDescription("");
      setQuantity("1");
      setCategorySlug("");
      setPremium(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding="lg" className="shadow-ds-soft">
      <h2 className="text-lg font-semibold">Submit RFQ</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">Request quotes from verified wholesale suppliers.</p>
      <div className="mt-ds-4 space-y-ds-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Request title"
          className="w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe quantity, specs, and delivery requirements"
          rows={4}
          className="w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
        />
        <div className="grid gap-ds-3 sm:grid-cols-2">
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Quantity"
            type="number"
            min={1}
            className="w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
          />
          <input
            value={categorySlug}
            onChange={(event) => setCategorySlug(event.target.value)}
            placeholder="Category slug (optional)"
            className="w-full rounded-ds-lg border border-border px-ds-3 py-ds-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-ds-2 text-sm text-text-secondary">
          <input type="checkbox" checked={premium} onChange={(event) => setPremium(event.target.checked)} />
          Premium RFQ (priority visibility)
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button disabled={submitting || title.length < 3 || description.length < 10} onClick={() => void submit()}>
          Submit RFQ
        </Button>
      </div>
    </Card>
  );
}
