"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { answerOk } from "@/lib/safety";

const schema = z.object({ subject: z.string().min(3, "أدخل وصف المحتوى المُراجَع") });

export type ReviewState = { error?: string; ok?: boolean };

export async function createComplianceReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const s = await requireSession();
  try { assertCan(s, "compliance.review"); } catch { return { error: "ليست لديك صلاحية مراجعة الامتثال" }; }

  const parsed = schema.safeParse({ subject: formData.get("subject") });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  // Snapshot the currently-active checklist items (template is admin-managed).
  const items = await prisma.complianceItem.findMany({ where: { active: true }, orderBy: { order: "asc" } });
  const answers = items.map((it) => {
    const a = String(formData.get(`item_${it.id}`) ?? "yes");
    return { question: it.question, answer: a, ok: answerOk(a) };
  });
  const status = answers.every((a) => a.ok) ? "passed" : "failed";

  const review = await prisma.complianceReview.create({
    data: {
      tenantId: s.tid, subject: parsed.data.subject, status,
      answersJson: JSON.stringify(answers), reviewedBy: s.name,
      notes: String(formData.get("notes") ?? "") || null, createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "compliance.review", entity: "ComplianceReview", entityId: review.id, metaJson: JSON.stringify({ status }) },
  });
  revalidatePath("/compliance");
  return { ok: true };
}
