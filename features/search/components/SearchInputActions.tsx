"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ImageSearchCamera } from "@/components/home/ImageSearchCamera";
import { storeImageSearchQuery } from "@/lib/image-search/storage";

type SearchInputActionsProps = {
  className?: string;
};

/**
 * Search trailing actions — Camera only (Search System v1.0).
 * Voice Assistant permanently forbidden (NO AI / NO Voice policy).
 */
export function SearchInputActions({ className }: SearchInputActionsProps) {
  const router = useRouter();
  const cameraInputId = useId();
  const [processing, setProcessing] = useState(false);

  async function handleImageSearchFiles(files: FileList) {
    const file = files[0];
    if (!file) return;
    setProcessing(true);
    try {
      const { fileToDataUrl } = await import("@/lib/image-search/similarity");
      const dataUrl = await fileToDataUrl(file);
      storeImageSearchQuery(dataUrl);
      router.push("/search?visual=1");
    } catch {
      // Cancelled or unreadable — stay on search.
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <ImageSearchCamera
        inputId={`${cameraInputId}-camera`}
        processing={processing}
        onFilesSelected={(files) => void handleImageSearchFiles(files)}
      />
    </div>
  );
}
