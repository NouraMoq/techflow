"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";

export type CalState = { error?: string; ok?: boolean };

const schema = z.object({
  title: z.string().min(2, "أدخل العنوان"),
  date: z.string().min(1, "اختر التاريخ"),
  type: z.enum(["publish", "shoot", "approval", "campaign", "event", "trend", "contract", "note", "no_publish"]).default("event"),
});

export async function createCalendarItem(_prev: CalState, formData: FormData): Promise<CalState> {
  const s = await requireSession();
  // Scheduling content requires the schedule permission.
  try { assertCan(s, "content.schedule"); } catch { return { error: "ليست لديك صلاحية إضافة عناصر للتقويم" }; }
  const parsed = schema.safeParse({
    title: formData.get("title"), date: formData.get("date"), type: formData.get("type") || "event",
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const item = await prisma.editorialCalendarItem.create({
    data: {
      tenantId: s.tid, title: parsed.data.title, type: parsed.data.type,
      date: new Date(parsed.data.date + "T09:00:00.000Z"), createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "calendar.add", entity: "EditorialCalendarItem", entityId: item.id, metaJson: JSON.stringify({ type: parsed.data.type }) },
  });
  revalidatePath("/calendar");
  return { ok: true };
}
