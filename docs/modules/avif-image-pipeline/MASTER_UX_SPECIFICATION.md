# AVIF Image Pipeline — Master UX Specification

| Field | Value |
|---|---|
| **Status** | REVIEW |

Upload → validate original → generate AVIF derivatives → store → serve smallest matching derivative → JPEG/WebP/Next optimizer fallback.

Users never re-upload existing listings. Failed AVIF conversion does not block publish.
