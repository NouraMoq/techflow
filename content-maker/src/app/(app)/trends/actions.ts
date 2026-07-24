"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { analyzeFromSource } from "@/lib/trends/analyze";
import { TrendSourceNotConfiguredError, type TrendSource } from "@/lib/trends/types";

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

// ---- Trend Intelligence: import from a source → analyze → persist Trends ----
export type ImportState = { error?: string; ok?: boolean; imported?: number; topics?: number };
const SOURCES = ["manual", "mock", "csv", "json", "google_trends", "creative_center", "official_tiktok", "licensed"] as const;

export async function importAndAnalyze(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const s = await requireSession();
  try { assertCan(s, "trend.manage"); } catch { return { error: "ليست لديك صلاحية إدارة الترندات" }; }
  const source = String(formData.get("source") ?? "");
  if (!(SOURCES as readonly string[]).includes(source)) return { error: "مصدر غير معروف" };

  let payload: unknown;
  if (source === "manual") {
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return { error: "أدخل نص الإشارة (وصف/عنوان الفيديو)" };
    payload = { text, hashtags: String(formData.get("hashtags") ?? "").split(/[ ,;|]+/).filter(Boolean) };
  } else if (source === "csv") {
    payload = String(formData.get("csv") ?? "");
    if (!String(payload).trim()) return { error: "ألصق محتوى CSV" };
  } else if (source === "json") {
    payload = String(formData.get("json") ?? "");
    if (!String(payload).trim()) return { error: "ألصق محتوى JSON" };
  }

  try {
    const r = await analyzeFromSource(s.tid, source as TrendSource, payload, s.uid);
    await prisma.auditLog.create({
      data: { tenantId: s.tid, userId: s.uid, action: "trend.import", entity: "Trend", metaJson: JSON.stringify({ source, imported: r.imported, topics: r.topics }) },
    });
    revalidatePath("/trends");
    if (!r.imported) return { error: r.note ?? "لم يتم استيراد أي إشارة صالحة" };
    return { ok: true, imported: r.imported, topics: r.topics };
  } catch (e) {
    if (e instanceof TrendSourceNotConfiguredError)
      return { error: "هذا المصدر غير مُفعّل بعد (يحتاج مفاتيح رسمية). استخدم: يدوي / تجريبي / CSV / JSON حاليًا." };
    return { error: "تعذّر تحليل البيانات" };
  }
}

// Convert an analyzed trend into an Idea in the bank (reuses the existing Idea flow).
export async function convertTrendToIdea(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "idea.create"); } catch { return; }
  const id = String(formData.get("id") ?? "");
  const trend = await prisma.trend.findFirst({ where: { id, tenantId: s.tid, deletedAt: null } });
  if (!trend || trend.risk === "high") return; // high-risk: UI shows a crisis alert instead
  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return;

  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid, creatorId: creator.id,
      title: `من ترند: ${trend.name}`,
      description: trend.angle ?? trend.summary ?? null,
      status: "proposed", priority: "medium",
      fitScore: trend.clientScore ?? 0,
      sourceTrendId: trend.id,
      ownerId: s.uid, createdBy: s.uid,
      tagsJson: JSON.stringify(["ترند"]),
    },
  });
  await prisma.trend.updateMany({ where: { id: trend.id, tenantId: s.tid }, data: { status: "actioned", decision: "used" } });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "trend.convert", entity: "Trend", entityId: trend.id, metaJson: JSON.stringify({ ideaId: idea.id }) },
  });
  revalidatePath("/trends");
  revalidatePath("/ideas");
}
