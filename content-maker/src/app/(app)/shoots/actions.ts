"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { nextShootStatus } from "@/lib/production";

export type ShootState = { error?: string; ok?: boolean };

const createSchema = z.object({
  name: z.string().min(3, "أدخل اسم الجلسة"),
  location: z.string().optional(),
  date: z.string().optional(),
  cost: z.coerce.number().int().nonnegative().optional(),
});

export async function createShootSession(_prev: ShootState, formData: FormData): Promise<ShootState> {
  const s = await requireSession();
  try { assertCan(s, "shoot.manage"); } catch { return { error: "ليست لديك صلاحية إدارة جلسات التصوير" }; }
  const parsed = createSchema.safeParse({
    name: formData.get("name"), location: formData.get("location") || undefined,
    date: formData.get("date") || undefined, cost: formData.get("cost") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const session = await prisma.shootSession.create({
    data: {
      tenantId: s.tid, name: parsed.data.name, location: parsed.data.location ?? null,
      date: parsed.data.date ? new Date(parsed.data.date) : null, cost: parsed.data.cost ?? 0,
      status: "planned", createdBy: s.uid, crewJson: "[]",
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "shoot.create", entity: "ShootSession", entityId: session.id },
  });
  revalidatePath("/shoots");
  return { ok: true };
}

const idSchema = z.object({ id: z.string() });

export async function advanceShootStatus(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "shoot.manage"); } catch { return; }
  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const session = await prisma.shootSession.findFirst({ where: { id: parsed.data.id, tenantId: s.tid } });
  if (!session) return; // cross-tenant → no match
  await prisma.shootSession.update({ where: { id: session.id }, data: { status: nextShootStatus(session.status) } });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "shoot.advance", entity: "ShootSession", entityId: session.id },
  });
  revalidatePath("/shoots");
}

const shotSchema = z.object({ shotId: z.string(), status: z.enum(["todo", "shot", "approved", "reshoot"]) });

export async function setShotStatus(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "shoot.manage"); } catch { return; }
  const parsed = shotSchema.safeParse({ shotId: formData.get("shotId"), status: formData.get("status") });
  if (!parsed.success) return;
  // Ensure the shot belongs to a session in THIS tenant before updating.
  const shot = await prisma.shot.findFirst({
    where: { id: parsed.data.shotId, session: { tenantId: s.tid } },
  });
  if (!shot) return;
  await prisma.shot.update({ where: { id: shot.id }, data: { status: parsed.data.status } });
  revalidatePath("/shoots");
}
