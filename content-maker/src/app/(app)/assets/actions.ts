"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { getStorage } from "@/lib/storage/registry";
import { validateUpload, assetTypeFromMime, humanSize, safeName } from "@/lib/storage/types";

export type UploadState = { error?: string; ok?: boolean; name?: string };

// Server-side upload: validate → store via the storage adapter (S3 or Local) →
// record the Asset. Bytes/keys never round-trip through the client with creds.
export async function uploadAsset(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const s = await requireSession();
  try { assertCan(s, "files.upload"); } catch { return { error: "ليست لديك صلاحية رفع الملفات" }; }

  const file = formData.get("file");
  const folder = String(formData.get("folder") || "عام").slice(0, 60) || "عام";
  if (!(file instanceof File)) return { error: "اختر ملفًا" };

  const invalid = validateUpload(file.name, file.type, file.size);
  if (invalid) return { error: invalid };

  const buf = Buffer.from(await file.arrayBuffer());
  const key = `tenants/${s.tid}/assets/${randomUUID()}-${safeName(file.name)}`;

  try {
    await getStorage().put(key, buf, file.type);
  } catch {
    return { error: "تعذّر تخزين الملف — تحقق من إعداد التخزين." };
  }

  const asset = await prisma.asset.create({
    data: {
      tenantId: s.tid, name: file.name, type: assetTypeFromMime(file.type), folder,
      sizeLabel: humanSize(buf.byteLength), sizeBytes: buf.byteLength, contentType: file.type,
      storageKey: key, uploaded: true, ownerName: s.name, createdBy: s.uid,
    },
  });
  await prisma.assetVersion.create({ data: { assetId: asset.id, version: 1, note: "رفع أولي" } });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "asset.upload", entity: "Asset", entityId: asset.id, metaJson: JSON.stringify({ mode: getStorage().mode, bytes: buf.byteLength }) },
  });
  revalidatePath("/assets");
  return { ok: true, name: file.name };
}

// Soft-delete an asset (tenant-scoped) and best-effort remove the object.
export async function deleteAsset(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "files.upload"); } catch { return; }
  const id = String(formData.get("id") ?? "");
  const asset = await prisma.asset.findFirst({ where: { id, tenantId: s.tid, deletedAt: null } });
  if (!asset) return;
  await prisma.asset.update({ where: { id: asset.id }, data: { deletedAt: new Date() } });
  if (asset.uploaded && asset.storageKey) {
    try { await getStorage().remove(asset.storageKey); } catch { /* best-effort */ }
  }
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "asset.delete", entity: "Asset", entityId: asset.id },
  });
  revalidatePath("/assets");
}
