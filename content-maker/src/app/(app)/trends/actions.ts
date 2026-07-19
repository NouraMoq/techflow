"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";

export type TrendState = { error?: string; ok?: boolean };

const createSchema = z.object({
  name: z.string().min(2, "أدخل اسم الترند"),
  type: z.enum(["sound", "effect", "challenge", "format"]).optional(),
  hashtag: z.string().optional(),
  angle: z.string().optional(),
  growthScore: z.coerce.number().int().min(0).max(100).optional(),
});

// MANUAL entry only — no scraping / no unauthorized data collection.
export async function createTrend(_prev: TrendState, formData: FormData): Promise<TrendState> {
  const s = await requireSession();
  try { assertCan(s, "trend.manage"); } catch { return { error: "ليست لديك صلاحية إدارة الترندات" }; }
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || undefined,
    hashtag: formData.get("hashtag") || undefined,
    angle: formData.get("angle") || undefined,
    growthScore: formData.get("growthScore") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const trend = await prisma.trend.create({
    data: {
      tenantId: s.tid, name: parsed.data.name, type: parsed.data.type ?? null,
      hashtag: parsed.data.hashtag ?? null, angle: parsed.data.angle ?? null,
      growthScore: parsed.data.growthScore ?? 0, decision: "studying", createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "trend.create", entity: "Trend", entityId: trend.id },
  });
  revalidatePath("/trends");
  return { ok: true };
}

const decisionSchema = z.object({ id: z.string(), decision: z.enum(["studying", "use", "ignore", "used"]) });

export async function setTrendDecision(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "trend.manage"); } catch { return; }
  const parsed = decisionSchema.safeParse({ id: formData.get("id"), decision: formData.get("decision") });
  if (!parsed.success) return;
  await prisma.trend.updateMany({
    where: { id: parsed.data.id, tenantId: s.tid }, // tenant-scoped
    data: { decision: parsed.data.decision },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "trend.decision", entity: "Trend", entityId: parsed.data.id, metaJson: JSON.stringify({ decision: parsed.data.decision }) },
  });
  revalidatePath("/trends");
}
