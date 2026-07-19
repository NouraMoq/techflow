"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { getPublishAdapter, isLiveConfigured } from "@/lib/integrations/registry";
import type { Platform } from "@/lib/integrations/types";

export type PublishActionState = { error?: string; ok?: boolean };

const createSchema = z.object({
  projectId: z.string().optional(),
  caption: z.string().min(3, "الوصف قصير جدًا"),
});

// Step 1: prepare a publish job (status "ready"). Requires a connected platform.
export async function createPublishJob(_prev: PublishActionState, formData: FormData): Promise<PublishActionState> {
  const s = await requireSession();
  try { assertCan(s, "content.schedule"); } catch { return { error: "ليست لديك صلاحية الجدولة/النشر" }; }
  const parsed = createSchema.safeParse({
    projectId: formData.get("projectId") || undefined,
    caption: formData.get("caption"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const integration = await prisma.integration.findUnique({
    where: { tenantId_provider: { tenantId: s.tid, provider: "tiktok" } },
  });
  if (!integration || integration.status !== "connected") {
    return { error: "اربط حساب TikTok أولًا من صفحة التكاملات." };
  }

  const job = await prisma.publishJob.create({
    data: {
      tenantId: s.tid,
      projectId: parsed.data.projectId && parsed.data.projectId !== "none" ? parsed.data.projectId : null,
      platform: "tiktok", caption: parsed.data.caption, status: "ready",
      mode: integration.mode, createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "publish.prepare", entity: "PublishJob", entityId: job.id },
  });
  revalidatePath("/publishing");
  return { ok: true };
}

const idSchema = z.object({ id: z.string() });

// Step 2: run the publish through the adapter. CRITICAL: only mark "published"
// when the adapter returns a CONFIRMED success. Otherwise "failed".
export async function runPublish(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "content.publish"); } catch { return; }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const job = await prisma.publishJob.findFirst({ where: { id: parsed.data.id, tenantId: s.tid } });
  if (!job || job.status === "published") return;

  await prisma.publishJob.update({
    where: { id: job.id }, data: { status: "publishing", attempts: { increment: 1 } },
  });

  const adapter = getPublishAdapter(job.platform as Platform);
  let confirmed = false;
  try {
    const result = await adapter.publish({ caption: job.caption ?? "", scheduledAt: job.scheduledAt });
    confirmed = result.status === "published" && Boolean(result.externalId);
    await prisma.publishJob.update({
      where: { id: job.id },
      data: confirmed
        ? { status: "published", externalId: result.externalId, externalUrl: result.externalUrl ?? null, mode: result.mode, error: null }
        : { status: "failed", error: result.error ?? "لم تُؤكِّد الواجهة النشر", mode: result.mode },
    });
  } catch (e) {
    // Live adapter not configured / API error → never claim success.
    await prisma.publishJob.update({
      where: { id: job.id },
      data: { status: "failed", error: isLiveConfigured("tiktok") ? "خطأ من واجهة TikTok" : "التكامل المباشر غير مهيأ — استخدم الوضع التجريبي أو النشر اليدوي." },
    });
  }

  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: confirmed ? "publish.confirmed" : "publish.failed", entity: "PublishJob", entityId: job.id },
  });
  revalidatePath("/publishing");
}

const manualSchema = z.object({ id: z.string(), url: z.string().url("رابط غير صالح") });

// Phase 1 fallback: record a manually-published post URL (no automated claim).
export async function recordManualPost(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "content.publish"); } catch { return; }
  const parsed = manualSchema.safeParse({ id: formData.get("id"), url: formData.get("url") });
  if (!parsed.success) return;
  await prisma.publishJob.updateMany({
    where: { id: parsed.data.id, tenantId: s.tid },
    data: { status: "manual", externalUrl: parsed.data.url },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "publish.manual", entity: "PublishJob", entityId: parsed.data.id },
  });
  revalidatePath("/publishing");
}
