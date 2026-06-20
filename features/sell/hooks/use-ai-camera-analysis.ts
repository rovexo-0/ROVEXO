"use client";

import { useCallback, useState } from "react";
import type { AiCameraAnalysisResult } from "@/lib/ai-camera/types";

type UseAiCameraAnalysisState = {
  isAnalyzing: boolean;
  error: string | null;
  result: AiCameraAnalysisResult | null;
  previewUrl: string | null;
};

export function useAiCameraAnalysis() {
  const [state, setState] = useState<UseAiCameraAnalysisState>({
    isAnalyzing: false,
    error: null,
    result: null,
    previewUrl: null,
  });

  const reset = useCallback(() => {
    setState((current) => {
      if (current.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return {
        isAnalyzing: false,
        error: null,
        result: null,
        previewUrl: null,
      };
    });
  }, []);

  const analyze = useCallback(async (file: File) => {
    setState((current) => {
      if (current.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return {
        ...current,
        isAnalyzing: true,
        error: null,
        result: null,
        previewUrl: URL.createObjectURL(file),
      };
    });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/ai/camera/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Analysis failed.");
      }

      const result = (await response.json()) as AiCameraAnalysisResult;

      setState((current) => ({
        ...current,
        isAnalyzing: false,
        result,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : "Analysis failed.",
      }));
    }
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}
