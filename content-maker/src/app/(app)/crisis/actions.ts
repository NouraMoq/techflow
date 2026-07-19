"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { nextCrisisStatus } from "@/lib/safety";

const schema = z.object({
  title: z.string().min(3, "أدخل عنوان الموقف"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  source: z.string().optional(),
  playbookId: z.string().optional(),
});

export type CrisisState = { error?: string; ok?: boolean };

export async function createCrisisCase(_prev: CrisisState, formData: FormData): Promise<CrisisState> {
  const s = await requireSession();
  try { assertCan(s, "crisis.manage"); } catch { return { error: "ليست لديك صلاحية إدارة الأزمات" }; }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    severity: formData.get("severity") || "medium",
    source: formData.get("source") || undefined,
    playbookId: formData.get("playbookId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const c = await prisma.crisisCase.create({
    data: {
      tenantId: s.tid, title: parsed.data.title, severity: parsed.data.severity,
      source: parsed.data.source ?? null,
      playbookId: parsed.data.playbookId && parsed.data.playbookId !== "none" ? parsed.data.playbookId : null,
      status: "open", approvalStatus: "draft", createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "crisis.create", entity: "CrisisCase", entityId: c.id },
  });
  revalidatePath("/crisis");
  return { ok: true };
}

const advSchema = z.object({ id: z.string() });

export async function advanceCrisis(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "crisis.manage"); } catch { return; }
  const parsed = advSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const c = await prisma.crisisCase.findFirst({ where: { id: parsed.data.id, tenantId: s.tid } });
  if (!c) return; // cross-tenant → no match
  await prisma.crisisCase.update({ where: { id: c.id }, data: { status: nextCrisisStatus(c.status) } });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "crisis.advance", entity: "CrisisCase", entityId: c.id },
  });
  revalidatePath("/crisis");
}
