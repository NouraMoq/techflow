"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";

export type CaptureState = { error?: string; ok?: boolean };

const schema = z.object({ title: z.string().min(3, "اكتب فكرتك") });

// Quick idea capture from the portal — drops straight into the idea bank as a draft.
export async function captureIdea(_prev: CaptureState, formData: FormData): Promise<CaptureState> {
  const s = await requireSession();
  try { assertCan(s, "idea.create"); } catch { return { error: "ليست لديك صلاحية إضافة فكرة" }; }
  const parsed = schema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return { error: "لا يوجد صانع محتوى" };

  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid, creatorId: creator.id, title: parsed.data.title, status: "draft",
      priority: "medium", ownerId: s.uid, createdBy: s.uid, tagsJson: JSON.stringify(["من البوابة"]),
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "portal.idea.capture", entity: "Idea", entityId: idea.id },
  });
  revalidatePath("/portal");
  return { ok: true };
}
