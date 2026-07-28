/**
 * ROVEXO Photo Delete UX v1.0
 *
 * STATUS: READY FOR IMPLEMENTATION · COD SÂNGE · OWNER LAW
 *
 * Absolute: Deleting a photo SHALL be INSTANT.
 * NO confirmation dialog · NO popup · NO refresh · NO ghost thumbnail · NO blank slot.
 *
 * Flow: Tap X → remove immediately → remaining slide left → counter updates →
 * Add Photos stays last → same-frame re-render.
 *
 * Fail closed: on internal failure restore previous state.
 * Never leave empty thumbnails or corrupted UI.
 */

export const PHOTO_DELETE_UX_V1 = {
  version: "1.0",
  id: "photo-delete-ux-v1",
  status: "IMPLEMENTED",
  instantDelete: true,
  confirmationDialogForbidden: true,
  popupForbidden: true,
  refreshForbidden: true,
  ghostThumbnailForbidden: true,
  blankSlotForbidden: true,
  slideLeftMs: { min: 150, max: 200, canonical: 180 } as const,
  revokeBlobObjectUrl: true,
  cancelActiveUploadOnly: true,
  failClosedRestore: true,
  targetUx: ["100% Vinted", "100% Native", "60 FPS", "Instant response"] as const,
} as const;
