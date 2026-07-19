"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { toJson } from "@/lib/json";

export type ScriptState = { error?: string; ok?: boolean };

// --- Create a new (blank or idea-linked) script, then open its editor.
const createSchema = z.object({ title: z.string().min(3, "أدخل عنوان السيناريو"), ideaId: z.string().optional() });

export async function createScript(_prev: ScriptState, formData: FormData): Promise<ScriptState> {
  const s = await requireSession();
  try { assertCan(s, "script.write"); } catch { return { error: "ليست لديك صلاحية كتابة السيناريو" }; }
  const parsed = createSchema.safeParse({ title: formData.get("title"), ideaId: formData.get("ideaId") || undefined });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };

  const script = await prisma.script.create({
    data: {
      tenantId: s.tid, title: parsed.data.title,
      ideaId: parsed.data.ideaId && parsed.data.ideaId !== "none" ? parsed.data.ideaId : null,
      status: "draft", version: 1, createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "script.create", entity: "Script", entityId: script.id },
  });
  redirect(`/scripts/${script.id}`);
}

// --- Save editor fields.
export async function saveScript(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "script.write"); } catch { return; }
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.script.findFirst({ where: { id, tenantId: s.tid } });
  if (!existing) return; // tenant-scoped guard

  const hashtags = String(formData.get("hashtags") ?? "")
    .split(/[،,\s]+/).map((t) => t.replace(/^#/, "").trim()).filter(Boolean);

  await prisma.script.update({
    where: { id: existing.id },
    data: {
      title: String(formData.get("title") ?? existing.title) || existing.title,
      hook: str(formData, "hook"), intro: str(formData, "intro"), body: str(formData, "body"),
      cta: str(formData, "cta"), onScreenText: str(formData, "onScreenText"),
      description: str(formData, "description"), hashtagsJson: toJson(hashtags),
      music: str(formData, "music"), wardrobe: str(formData, "wardrobe"), location: str(formData, "location"),
      totalDuration: str(formData, "totalDuration"), notes: str(formData, "notes"),
      disclosure: formData.get("disclosure") === "on",
      updatedBy: s.uid,
    },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "script.save", entity: "Script", entityId: existing.id },
  });
  revalidatePath(`/scripts/${existing.id}`);
}

// --- Snapshot current content into a new version.
export async function createScriptVersion(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "script.write"); } catch { return; }
  const id = String(formData.get("id") ?? "");
  const script = await prisma.script.findFirst({ where: { id, tenantId: s.tid } });
  if (!script) return;
  const nextVersion = script.version + 1;
  await prisma.scriptVersion.create({
    data: { scriptId: script.id, version: nextVersion, contentJson: toJson({ hook: script.hook, body: script.body, cta: script.cta }) },
  });
  await prisma.script.update({ where: { id: script.id }, data: { version: nextVersion } });
  revalidatePath(`/scripts/${script.id}`);
}

// --- Change status (send for review / approve / request changes).
const statusSchema = z.object({ id: z.string(), status: z.enum(["draft", "review", "changes_requested", "approved"]) });

export async function setScriptStatus(formData: FormData): Promise<void> {
  const s = await requireSession();
  const parsed = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  // Approving requires approval rights; other transitions require write rights.
  try { assertCan(s, parsed.data.status === "approved" ? "content.approve" : "script.write"); } catch { return; }
  await prisma.script.updateMany({
    where: { id: parsed.data.id, tenantId: s.tid }, data: { status: parsed.data.status },
  });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "script.status", entity: "Script", entityId: parsed.data.id, metaJson: toJson({ status: parsed.data.status }) },
  });
  revalidatePath(`/scripts/${parsed.data.id}`);
}

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};
