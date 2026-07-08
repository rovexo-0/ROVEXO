"use client";

/**
 * ROVEXO Canonical Image — platform SSOT for rendering images safely.
 *
 * Guarantees (ROVEXO v1.0 permanent UI rule):
 *  - Never renders `next/image` with an empty / null / undefined / invalid src.
 *  - Never shows the browser's default broken-image icon: if a source fails to
 *    load at runtime (404, bad host, expired storage URL), it swaps to the
 *    official ROVEXO placeholder (or renders nothing when `fallback="hide"`).
 *  - The placeholder is rendered as a plain <img> of a local SVG so it bypasses
 *    the Next image optimizer (which 400s on SVG unless `dangerouslyAllowSVG`),
 *    meaning the fallback itself can never break.
 *
 * Use this everywhere product/user/store/banner imagery is displayed.
 */

import Image, { type ImageProps, type StaticImageData } from "next/image";
import { useState, type CSSProperties, type SyntheticEvent } from "react";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

export { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";

type ImageSrc = string | StaticImageData | null | undefined;

function isUsableSafeImageSrc(src: ImageSrc): src is string | StaticImageData {
  if (src == null) return false;
  if (typeof src !== "string") return true;
  return isRenderableImageSrc(src);
}

export type SafeImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: ImageSrc;
  /** Alt text. Defaults to "" (decorative) so the placeholder is never announced. */
  alt?: string;
  /** Local placeholder used when the source is missing/invalid/broken. */
  fallbackSrc?: string;
  /** What to render when there is no valid image: placeholder (default) or nothing. */
  fallback?: "placeholder" | "hide";
};

function imageSourceKey(src: ImageSrc): string {
  if (src == null) return "";
  if (typeof src !== "string") return src.src;
  return src;
}

export function SafeImage({
  src,
  alt = "",
  fallbackSrc = PRODUCT_IMAGE_FALLBACK,
  fallback = "placeholder",
  className,
  style,
  fill,
  width,
  height,
  onError,
  ...rest
}: SafeImageProps) {
  const sourceKey = imageSourceKey(src);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const broken = failedKey === sourceKey;

  const usable = isUsableSafeImageSrc(src) && !broken;

  if (!usable) {
    if (fallback === "hide") return null;

    const placeholderStyle: CSSProperties = fill
      ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }
      : { width, height, objectFit: "cover", ...style };

    return (
      // Plain <img> intentionally bypasses the Next optimizer so the local SVG
      // placeholder always renders and can never surface a broken-image icon.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackSrc}
        alt={alt}
        aria-hidden={alt.length === 0 || undefined}
        draggable={false}
        className={className}
        style={placeholderStyle}
      />
    );
  }

  return (
    <Image
      src={src as string | StaticImageData}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
        setFailedKey(sourceKey);
        onError?.(event);
      }}
      {...rest}
    />
  );
}
