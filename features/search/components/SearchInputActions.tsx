"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ImageSearchCamera } from "@/components/home/ImageSearchCamera";
import { storeImageSearchQuery } from "@/lib/image-search/storage";
import { prepareSearchImage } from "@/lib/search/image-pipeline";

type SearchInputActionsProps = {
  className?: string;
};

/**
 * Search Engine v1.0 — ONE camera system entry (overlay).
 * Pipeline: validate → crop/compress → image match. NO AI / NO Voice.
 * Fail-safe: pipeline failure → text search route.
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
      const prepared = await prepareSearchImage(file, {
        centerCrop: true,
        rotateDeg: 0,
        maxEdge: 640,
      });
      if (!prepared.ok) {
        // IMAGE SEARCH FAILS → fallback TEXT SEARCH
        router.push("/search");
        return;
      }
      storeImageSearchQuery(prepared.dataUrl);
      router.push("/search?visual=1");
    } catch {
      router.push("/search");
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
