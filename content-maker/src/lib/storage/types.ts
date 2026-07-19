// ============================================================================
// Storage adapter contract (Adapter Pattern — mirrors the integration layer).
// A real S3 provider is used when credentials exist; otherwise a Local provider
// (disk-backed) so the whole upload/download flow works without S3.
// SECURITY: object keys/creds never reach the frontend; downloads go through
// short-lived Signed URLs; uploads are type/size validated server-side.
// ============================================================================
export type StorageMode = "s3" | "local";

export interface PutResult {
  key: string;
  size: number;
}

export interface StorageAdapter {
  readonly mode: StorageMode;
  /** Store bytes under `key`. */
  put(key: string, data: Buffer, contentType: string): Promise<PutResult>;
  /** A short-lived signed URL to download the object (never exposes credentials). */
  getSignedUrl(key: string, expiresSec?: number): Promise<string>;
  /** Remove the object (best-effort). */
  remove(key: string): Promise<void>;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("S3 storage is not configured (missing credentials).");
    this.name = "StorageNotConfiguredError";
  }
}

// ---- Upload guardrails ------------------------------------------------------
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB (demo cap)

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/quicktime", "video/webm",
  "audio/mpeg", "audio/mp4", "audio/wav",
  "application/pdf", "text/plain",
];

export function validateUpload(name: string, contentType: string, size: number): string | null {
  if (!name || name.length > 200) return "اسم الملف غير صالح";
  if (size <= 0) return "الملف فارغ";
  if (size > MAX_UPLOAD_BYTES) return `حجم الملف يتجاوز الحد (${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB)`;
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) return "نوع الملف غير مسموح";
  return null;
}

// Map a MIME type to our Asset.type category (Arabic-labeled elsewhere).
export function assetTypeFromMime(mime: string): string {
  if (mime.startsWith("video/")) return "raw_video";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "music";
  if (mime === "application/pdf") return "contract";
  return "template";
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

// Sanitize a filename into a safe storage-key segment.
export function safeName(name: string): string {
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(0, 120);
}
