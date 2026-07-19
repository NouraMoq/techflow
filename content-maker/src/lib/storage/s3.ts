import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";
import { StorageNotConfiguredError, type StorageAdapter, type PutResult, type StorageMode } from "./types";

// ============================================================================
// S3StorageAdapter — real S3-compatible object storage (AWS S3, MinIO, etc.).
// Active only when credentials are present. Downloads use presigned GET URLs
// (time-limited, no credentials exposed). Uploads are server-side PutObject
// (bytes never touch the client with keys). Only instantiated by the registry
// when isS3Configured() is true.
// ============================================================================
export function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_REGION
  );
}

export class S3StorageAdapter implements StorageAdapter {
  readonly mode: StorageMode = "s3";
  private bucket: string;
  private client: S3Client;

  constructor() {
    if (!isS3Configured()) throw new StorageNotConfiguredError();
    this.bucket = process.env.S3_BUCKET!;
    this.client = new S3Client({
      region: process.env.S3_REGION!,
      // Optional custom endpoint (MinIO / non-AWS S3-compatible).
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async put(key: string, data: Buffer, contentType: string): Promise<PutResult> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket, Key: key, Body: data, ContentType: contentType,
    }));
    return { key, size: data.byteLength };
  }

  async getSignedUrl(key: string, expiresSec = 300): Promise<string> {
    return presign(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresSec });
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
