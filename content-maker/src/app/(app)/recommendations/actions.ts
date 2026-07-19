"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { generateRecommendations } from "@/lib/recommendations-engine";

// Regenerate recommendations FROM the tenant's own data. Idempotent via `key`.
export async function regenerate(): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "recommendation.manage"); } catch { return; }
  const generated = await generateRecommendations(s.tid);
  for (const g of generated) {
    await prisma.recommendation.upsert({
      where: { tenantId_key: { tenantId: s.tid, key: g.key } },
      // Don't overwrite a rec the user already actioned; only refresh open ones.
      update: { text: g.text, basis: g.basis, confidence: g.confidence, category: g.category, ownerRole: g.ownerRole },
      create: { tenantId: s.tid, key: g.key, text: g.text, basis: g.basis, confidence: g.confidence, category: g.category, ownerRole: g.ownerRole, createdBy: s.uid },
    });
  }
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "recommendation.generate", entity: "Recommendation", metaJson: JSON.stringify({ count: generated.length }) } });
  revalidatePath("/recommendations");
}

const idSchema = z.object({ id: z.string() });

// Apply: mark applied AND create a follow-up task (cross-module).
export async function applyRecommendation(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "recommendation.manage"); } catch { return; }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const rec = await prisma.recommendation.findFirst({ where: { id: parsed.data.id, tenantId: s.tid } });
  if (!rec || rec.status === "applied") return;

  await prisma.recommendation.update({ where: { id: rec.id }, data: { status: "applied", result: "حُوّلت إلى مهمة" } });
  await prisma.task.create({
    data: { tenantId: s.tid, title: `توصية: ${rec.text}`, ownerName: rec.ownerRole ?? "المسؤول", priority: rec.confidence === "high" ? "high" : "medium", status: "todo" },
  });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "recommendation.apply", entity: "Recommendation", entityId: rec.id } });
  revalidatePath("/recommendations");
}

export async function dismissRecommendation(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "recommendation.manage"); } catch { return; }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  await prisma.recommendation.updateMany({ where: { id: parsed.data.id, tenantId: s.tid }, data: { status: "dismissed" } });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "recommendation.dismiss", entity: "Recommendation", entityId: parsed.data.id } });
  revalidatePath("/recommendations");
}
