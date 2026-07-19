import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageAdapter, PutResult, StorageMode } from "./types";
import { signStorageToken } from "./token";

// ============================================================================
// LocalStorageAdapter — disk-backed stand-in used when S3 is not configured.
// Files live under <cwd>/.storage/<key> (gitignored, ephemeral). Download URLs
// are short-lived signed tokens served by /api/storage/download — the same
// "signed URL" contract as S3, so swapping to S3 changes nothing upstream.
// ============================================================================
const ROOT = path.join(process.cwd(), ".storage");

function resolveSafe(key: string): string {
  // Prevent path traversal: resolved path must stay under ROOT.
  const p = path.join(ROOT, key);
  if (!p.startsWith(ROOT + path.sep)) throw new Error("invalid key");
  return p;
}

export class LocalStorageAdapter implements StorageAdapter {
  readonly mode: StorageMode = "local";

  async put(key: string, data: Buffer, _contentType: string): Promise<PutResult> {
    const dest = resolveSafe(key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, data);
    return { key, size: data.byteLength };
  }

  async getSignedUrl(key: string, expiresSec = 300): Promise<string> {
    const token = await signStorageToken(key, expiresSec);
    return `/api/storage/download?token=${encodeURIComponent(token)}`;
  }

  async remove(key: string): Promise<void> {
    try { await fs.unlink(resolveSafe(key)); } catch { /* best-effort */ }
  }

  // Used by the download route to stream the bytes.
  async read(key: string): Promise<Buffer> {
    return fs.readFile(resolveSafe(key));
  }
}
