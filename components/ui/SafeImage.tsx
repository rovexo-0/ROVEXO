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

import Image, { getImageProps, type ImageProps, type StaticImageData } from "next/image";
import { useState, type CSSProperties, type SyntheticEvent } from "react";
import { isFailedImageSrc, markFailedImageSrc } from "@/lib/media/failed-image-src";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { isStoredAvifUrl } from "@/lib/media/avif-image-pipeline-v1";
import {
  isLegacyJpegThumbUrl,
  isRelativeSvgListingImage,
  isUnreachableListingStorageUrl,
  LOCAL_STORAGE_BROWSER_PREFIX,
  PRODUCT_IMAGE_FALLBACK,
  isLoopbackSupabaseStorageUrl,
  toBrowserReachableStorageUrl,
} from "@/lib/media/product-image";

export { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";

type ImageSrc = string | StaticImageData | null | undefined;

function isUsableSafeImageSrc(src: ImageSrc): src is string | StaticImageData {
  if (src == null) return false;
  if (typeof src !== "string") return true;
  if (isFailedImageSrc(src)) return false;
  if (isUnreachableListingStorageUrl(src)) return false;
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
  priority,
  fetchPriority,
  loading,
  unoptimized,
  onError,
  onLoad,
  ...rest
}: SafeImageProps) {
  const deliveredSrc = typeof src === "string" ? toBrowserReachableStorageUrl(src) : src;
  const sourceKey = imageSourceKey(deliveredSrc);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const broken = failedKey === sourceKey;

  const usable = isUsableSafeImageSrc(deliveredSrc) && !broken;
  const storedAvif = typeof deliveredSrc === "string" && isStoredAvifUrl(deliveredSrc);
  const legacyJpegThumb = typeof deliveredSrc === "string" && isLegacyJpegThumbUrl(deliveredSrc);
  const localSvg = typeof deliveredSrc === "string" && isRelativeSvgListingImage(deliveredSrc);
  const localKongProxy =
    typeof deliveredSrc === "string" &&
    (deliveredSrc.startsWith(`${LOCAL_STORAGE_BROWSER_PREFIX}/`) ||
      isLoopbackSupabaseStorageUrl(deliveredSrc));
  const resolvedUnoptimized =
    unoptimized === true || storedAvif || legacyJpegThumb || localKongProxy;
  /* P1 CWV: LCP candidates with `priority` also declare high fetch priority explicitly. */
  const resolvedFetchPriority = fetchPriority ?? (priority ? "high" : undefined);
  /*
   * Homepage feed LCP only — matches ListingCard intrinsic 200×250 + priority.
   * Production Next.js ImagePreload emits imageSrcSet without href, so the
   * browser does not fetch until the parser reaches the <img>. Emit one
   * explicit preload with href and disable the automatic preload for this
   * image only. Density srcset (1x/2x) does not use imageSizes.
   * Media is the existing 200px feed-sizes slot: (max-width: 440px).
   * That is the PSI/iPhone card width (185–199px), not the 2x file width 640.
   */
  const isHomepageFeedLcp =
    Boolean(priority) &&
    !fill &&
    resolvedUnoptimized !== true &&
    width === 200 &&
    height === 250 &&
    typeof deliveredSrc === "string";
  const homepageFeedLcpPreload = isHomepageFeedLcp
    ? (() => {
        const { props } = getImageProps({
          src: deliveredSrc,
          width: 200,
          height: 250,
          alt,
        });
        if (!props.src || !props.srcSet) return null;
        return { href: props.src, imageSrcSet: props.srcSet };
      })()
    : null;

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

  if (localSvg) {
    const svgStyle: CSSProperties = fill
      ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }
      : { width, height, objectFit: "cover", ...style };

    return (
      // Local listing SVGs (E2E category icons / placeholders) must not enter
      // next/image — the optimizer 400s on SVG and must never proxy Storage.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={deliveredSrc as string}
        alt={alt}
        aria-hidden={alt.length === 0 || undefined}
        draggable={false}
        className={className}
        style={svgStyle}
      />
    );
  }

  const image = (
    <Image
      {...rest}
      src={deliveredSrc as string | StaticImageData}
      alt={alt}
      fill={fill ? true : undefined}
      width={width}
      height={height}
      className={className}
      style={style}
      unoptimized={resolvedUnoptimized ? true : undefined}
      fetchPriority={resolvedFetchPriority}
      {...(homepageFeedLcpPreload
        ? { priority: false as const, preload: false as const, loading: "eager" as const }
        : { priority, loading })}
      onLoad={(event) => {
        /* Optimizer/host failures and corrupt Storage objects can report
         * complete with 0×0 or 1×1 placeholders — treat as broken. */
        const el = event.currentTarget;
        if (el.naturalWidth <= 2 || el.naturalHeight <= 2) {
          markFailedImageSrc(sourceKey);
          setFailedKey(sourceKey);
        }
        onLoad?.(event);
      }}
      onError={(event: SyntheticEvent<HTMLImageElement, Event>) => {
        markFailedImageSrc(sourceKey);
        setFailedKey(sourceKey);
        onError?.(event);
      }}
    />
  );

  return (
    <>
      {homepageFeedLcpPreload ? (
        <link
          rel="preload"
          as="image"
          href={homepageFeedLcpPreload.href}
          imageSrcSet={homepageFeedLcpPreload.imageSrcSet}
          fetchPriority="high"
          media="(max-width: 440px)"
        />
      ) : null}
      {/*
       * React 19 auto-emits a no-href image preload for <img fetchPriority="high" srcSet>.
       * <picture> sets SSR tagScope so that hint is skipped; display:contents keeps
       * the existing .visual img box tree (no layout/CSS change).
       */}
      {homepageFeedLcpPreload ? <picture style={{ display: "contents" }}>{image}</picture> : image}
    </>
  );
}
