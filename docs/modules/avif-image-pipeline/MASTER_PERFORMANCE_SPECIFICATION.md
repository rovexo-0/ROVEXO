# AVIF Image Pipeline — Master Performance Specification

| Field | Value |
|---|---|
| **Status** | REVIEW |

Targets: materially smaller payloads than originals; three derivatives only; Sharp effort 2 at upload; cache-control 31536000; no per-request conversion for stored AVIF.

Existing JPEG listings continue to use Next/Image `formats: ["image/avif", "image/webp"]` with `minimumCacheTTL` 30 days. Card/list/grid surfaces keep a stored sibling `-thumb.jpg` at read time when present (400px JPEG); they do not download the original listing JPEG unless the thumb is missing or unsafe.

Measured fixture bytes (`tests/avif-image-pipeline-v1.test.ts`, JPEG 1200–1600px):

| | Bytes |
|---|---|
| Original JPEG avg | 334720 |
| AVIF thumb avg | 2126 |
| AVIF medium avg | 21163 |
| AVIF large avg | 171204 |
| Large vs original | 49% reduction |

