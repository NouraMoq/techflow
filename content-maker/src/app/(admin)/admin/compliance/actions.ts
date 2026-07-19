"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin, assertCan } from "@/lib/session";

const schema = z.object({ id: z.string(), active: z.enum(["true", "false"]) });

// Admin-only: enable/disable a compliance checklist item (rules change over time).
export async function toggleComplianceItem(formData: FormData): Promise<void> {
  const s = await requireAdmin();
  try { assertCan(s, "admin.access"); } catch { return; }
  const parsed = schema.safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return;
  await prisma.complianceItem.update({
    where: { id: parsed.data.id },
    data: { active: parsed.data.active === "true" },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "compliance.item.toggle", entity: "ComplianceItem", entityId: parsed.data.id, metaJson: JSON.stringify({ active: parsed.data.active }) },
  });
  revalidatePath("/admin/compliance");
}
