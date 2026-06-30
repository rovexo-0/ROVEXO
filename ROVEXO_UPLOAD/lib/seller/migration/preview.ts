import type { MigrationPreviewItem } from "@/lib/seller/migration/types";

export function buildPreviewItems(
  platformLabel: string,
  methodLabel: string,
): MigrationPreviewItem[] {
  return [
    {
      id: "preview-1",
      title: `${platformLabel} — Classic denim jacket`,
      price: "£45.00",
      imageLabel: "Photo 1",
      status: "ready",
    },
    {
      id: "preview-2",
      title: `${platformLabel} — Wireless earbuds`,
      price: "£29.99",
      imageLabel: "Photo 2",
      status: "ready",
    },
    {
      id: "preview-3",
      title: `${platformLabel} — Vintage side table`,
      price: "£120.00",
      imageLabel: "Photo 3",
      status: "warning",
      note: "Category mapping review suggested",
    },
    {
      id: "preview-4",
      title: `${platformLabel} — Running trainers`,
      price: "£64.50",
      imageLabel: "Photo 4",
      status: "ready",
    },
    {
      id: "preview-5",
      title: `${methodLabel} batch item`,
      price: "£18.00",
      imageLabel: "Photo 5",
      status: "ready",
    },
  ];
}
