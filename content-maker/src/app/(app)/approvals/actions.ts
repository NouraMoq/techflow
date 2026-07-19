"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";

const schema = z.object({ id: z.string(), decision: z.enum(["approved", "rejected", "changes_requested"]) });

export async function decideApproval(formData: FormData): Promise<void> {
  const s = await requireSession();
  const parsed = schema.safeParse({ id: formData.get("id"), decision: formData.get("decision") });
  if (!parsed.success) return;
  try {
    assertCan(s, parsed.data.decision === "rejected" ? "content.reject" : "content.approve");
  } catch {
    return; // silently ignore — UI hides the buttons for unauthorized roles anyway
  }
  await prisma.approval.updateMany({
    where: { id: parsed.data.id, tenantId: s.tid }, // tenant-scoped
    data: { status: parsed.data.decision, decidedBy: s.name },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "approval.decide", entity: "Approval", entityId: parsed.data.id, metaJson: JSON.stringify({ decision: parsed.data.decision }) },
  });
  revalidatePath("/approvals");
}
