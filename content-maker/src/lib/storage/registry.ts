import "server-only";
import type { StorageAdapter } from "./types";
import { LocalStorageAdapter } from "./local";
import { S3StorageAdapter, isS3Configured } from "./s3";

// Returns the S3 adapter when credentials exist, else the Local (disk) adapter.
// Adding another backend later = register it here; callers are unchanged.
let cached: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cached) return cached;
  cached = isS3Configured() ? new S3StorageAdapter() : new LocalStorageAdapter();
  return cached;
}

export function storageMode(): "s3" | "local" {
  return isS3Configured() ? "s3" : "local";
}

export { isS3Configured };
