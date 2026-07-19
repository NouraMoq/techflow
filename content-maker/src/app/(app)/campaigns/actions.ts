"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { nextOpportunityStage } from "@/lib/commerce";

const brandSchema = z.object({
  name: z.string().min(2, "اسم العلامة قصير"),
  sector: z.string().optional(),
  dealValue: z.coerce.number().int().nonnegative().optional(),
});

export type NewBrandState = { error?: string; ok?: boolean };

// Creates a brand + an initial opportunity (lead) in one action.
export async function createBrandOpportunity(_prev: NewBrandState, formData: FormData): Promise<NewBrandState> {
  const s = await requireSession();
  try { assertCan(s, "contracts.view"); } catch { return { error: "ليست لديك صلاحية إدارة الشراكات" }; }

  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    sector: formData.get("sector") || undefined,
    dealValue: formData.get("dealValue") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const brand = await prisma.brand.create({
    data: { tenantId: s.tid, name: parsed.data.name, sector: parsed.data.sector, status: "active" },
  });
  await prisma.opportunity.create({
    data: {
      tenantId: s.tid, brandId: brand.id, title: `تعاون — ${parsed.data.name}`,
      stage: "lead", dealValue: parsed.data.dealValue ?? null, createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "brand.create", entity: "Brand", entityId: brand.id },
  });
  revalidatePath("/campaigns");
  return { ok: true };
}

const moveSchema = z.object({ id: z.string() });

export async function advanceOpportunity(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "contracts.view"); } catch { return; }
  const parsed = moveSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const opp = await prisma.opportunity.findFirst({ where: { id: parsed.data.id, tenantId: s.tid } });
  if (!opp) return; // cross-tenant id → no match
  await prisma.opportunity.update({
    where: { id: opp.id },
    data: { stage: nextOpportunityStage(opp.stage) },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "opportunity.advance", entity: "Opportunity", entityId: opp.id },
  });
  revalidatePath("/campaigns");
}
