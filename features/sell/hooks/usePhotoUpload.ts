"use client";

import { useCallback } from "react";
import { useSell } from "@/features/sell/context/SellProvider";

export function usePhotoUpload() {
  const { addPhotos, removePhoto, replacePhoto, reorderPhotos, setMainPhoto, retryPhotoUpload, uploadProgress } =
    useSell();

  const uploadPhotos = useCallback(
    async (files: FileList | File[]) => {
      await addPhotos(files);
    },
    [addPhotos],
  );

  return {
    uploadPhotos,
    removePhoto,
    replacePhoto,
    reorderPhotos,
    setMainPhoto,
    retryPhotoUpload,
    uploadProgress,
  };
}
