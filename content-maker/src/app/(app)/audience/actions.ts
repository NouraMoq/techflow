"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";

export type AudienceState = { error?: string; ok?: boolean };

const qSchema = z.object({
  text: z.string().min(3, "أدخل نص السؤال"),
  category: z.enum(["faq", "content_opportunity", "potential_ad", "escalation"]).default("faq"),
  count: z.coerce.number().int().min(1).optional(),
});

// Manual entry only — no scraping / no unauthorized collection.
export async function createQuestion(_prev: AudienceState, formData: FormData): Promise<AudienceState> {
  const s = await requireSession();
  try { assertCan(s, "audience.manage"); } catch { return { error: "ليست لديك صلاحية إدارة الجمهور" }; }
  const parsed = qSchema.safeParse({
    text: formData.get("text"), category: formData.get("category") || "faq", count: formData.get("count") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const q = await prisma.audienceQuestion.create({
    data: { tenantId: s.tid, text: parsed.data.text, category: parsed.data.category, count: parsed.data.count ?? 1, source: "إدخال يدوي", createdBy: s.uid },
  });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "audience.question.create", entity: "AudienceQuestion", entityId: q.id } });
  revalidatePath("/audience");
  return { ok: true };
}

const statusSchema = z.object({ id: z.string(), status: z.enum(["new", "answered", "converted", "escalated"]) });

export async function setQuestionStatus(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "audience.manage"); } catch { return; }
  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  await prisma.audienceQuestion.updateMany({ where: { id: parsed.data.id, tenantId: s.tid }, data: { status: parsed.data.status } });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "audience.question.status", entity: "AudienceQuestion", entityId: parsed.data.id, metaJson: JSON.stringify({ status: parsed.data.status }) } });
  revalidatePath("/audience");
}

// Turn a question into a content idea (cross-module integration).
export async function convertToIdea(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "idea.create"); } catch { return; }
  const id = String(formData.get("id") ?? "");
  const q = await prisma.audienceQuestion.findFirst({ where: { id, tenantId: s.tid } });
  if (!q || q.linkedIdeaId) return;
  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return;
  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid, creatorId: creator.id, title: `رد على سؤال: ${q.text}`, status: "proposed",
      priority: "medium", fitScore: 85, ownerId: s.uid, createdBy: s.uid, tagsJson: JSON.stringify(["أسئلة"]),
    },
  });
  await prisma.audienceQuestion.update({ where: { id: q.id }, data: { status: "converted", linkedIdeaId: idea.id } });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "audience.question.convert", entity: "Idea", entityId: idea.id } });
  revalidatePath("/audience");
}

const listSchema = z.object({ kind: z.enum(["response", "sensitive"]), text: z.string().min(1, "أدخل النص") });

export async function addListItem(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "audience.manage"); } catch { return; }
  const parsed = listSchema.safeParse({ kind: formData.get("kind"), text: formData.get("text") });
  if (!parsed.success) return;
  await prisma.audienceListItem.create({ data: { tenantId: s.tid, kind: parsed.data.kind, text: parsed.data.text, createdBy: s.uid } });
  revalidatePath("/audience");
}
