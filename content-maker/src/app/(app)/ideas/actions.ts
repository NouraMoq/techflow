"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";

const schema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(160),
  pillarId: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export type NewIdeaState = { error?: string; ok?: boolean };

export async function createIdea(_prev: NewIdeaState, formData: FormData): Promise<NewIdeaState> {
  const s = await requireSession();
  try {
    assertCan(s, "idea.create"); // RBAC
  } catch {
    return { error: "ليست لديك صلاحية إنشاء فكرة" };
  }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    pillarId: formData.get("pillarId") || undefined,
    priority: formData.get("priority") || "medium",
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  // Resolve the creator within THIS tenant only (isolation).
  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return { error: "لا يوجد صانع محتوى في هذا الحساب" };

  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid,
      creatorId: creator.id,
      pillarId: parsed.data.pillarId && parsed.data.pillarId !== "none" ? parsed.data.pillarId : null,
      title: parsed.data.title,
      priority: parsed.data.priority,
      status: "draft",
      ownerId: s.uid,
      createdBy: s.uid,
      tagsJson: "[]",
    },
  });

  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "idea.create", entity: "Idea", entityId: idea.id },
  });

  revalidatePath("/ideas");
  return { ok: true };
}

const moveSchema = z.object({ id: z.string(), status: z.string() });

export async function moveIdea(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "idea.edit"); } catch { return; }
  const parsed = moveSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  // updateMany scoped by tenantId — a cross-tenant id simply matches nothing.
  await prisma.idea.updateMany({
    where: { id: parsed.data.id, tenantId: s.tid },
    data: { status: parsed.data.status, updatedBy: s.uid },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "idea.move", entity: "Idea", entityId: parsed.data.id, metaJson: JSON.stringify({ status: parsed.data.status }) },
  });
  revalidatePath("/ideas");
}
