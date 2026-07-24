"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession, assertCan } from "@/lib/session";
import { analyzeFromSource } from "@/lib/trends/analyze";
import { detectOpportunities } from "@/lib/trends/opportunity";
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

// ---- Level 3: Opportunities (detect from trends + audience gaps) ----
export async function detectOpportunitiesAction(): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "trend.manage"); } catch { return; }
  const n = await detectOpportunities(s.tid, s.uid);
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "trend.opportunities.detect", entity: "TrendOpportunity", metaJson: JSON.stringify({ count: n }) },
  });
  revalidatePath("/trends");
}

export async function convertOpportunityToIdea(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "idea.create"); } catch { return; }
  const id = String(formData.get("id") ?? "");
  const opp = await prisma.trendOpportunity.findFirst({ where: { id, tenantId: s.tid, deletedAt: null } });
  if (!opp || opp.status === "converted") return;
  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return;

  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid, creatorId: creator.id,
      title: opp.title,
      description: opp.reason ?? null,
      status: "proposed", priority: "medium",
      fitScore: opp.score,
      sourceTrendId: opp.trendId ?? null,
      sourceOpportunityId: opp.id,
      ownerId: s.uid, createdBy: s.uid,
      tagsJson: JSON.stringify(["فرصة"]),
    },
  });
  await prisma.trendOpportunity.updateMany({ where: { id: opp.id, tenantId: s.tid }, data: { status: "converted", result: "حُوّلت إلى فكرة" } });
  if (opp.trendId) await prisma.trend.updateMany({ where: { id: opp.trendId, tenantId: s.tid }, data: { status: "actioned", decision: "used" } });
  await prisma.auditLog.create({
    data: { tenantId: s.tid, userId: s.uid, action: "trend.opportunity.convert", entity: "TrendOpportunity", entityId: opp.id, metaJson: JSON.stringify({ ideaId: idea.id }) },
  });
  revalidatePath("/trends");
  revalidatePath("/ideas");
}

// ---- "اصنع محتوى": turn a generated draft into an Idea (and optionally a Script) ----
async function resolveDraft(formData: FormData) {
  const trendId = String(formData.get("trendId") ?? "") || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "") || null;
  const cta = String(formData.get("cta") ?? "") || null;
  const hook = String(formData.get("hook") ?? "") || null;
  const shortScript = String(formData.get("shortScript") ?? "") || null;
  const hashtags = String(formData.get("hashtags") ?? "").split(/[ ,;|]+/).filter(Boolean);
  return { trendId, title, description, cta, hook, shortScript, hashtags };
}

export async function createIdeaFromDraft(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "idea.create"); } catch { return; }
  const d = await resolveDraft(formData);
  if (!d.title) return;
  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return;
  const trend = d.trendId ? await prisma.trend.findFirst({ where: { id: d.trendId, tenantId: s.tid, deletedAt: null }, select: { clientScore: true } }) : null;
  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid, creatorId: creator.id, title: d.title, description: d.description, cta: d.cta,
      status: "proposed", priority: "medium", fitScore: trend?.clientScore ?? 0,
      sourceTrendId: d.trendId, ownerId: s.uid, createdBy: s.uid, tagsJson: JSON.stringify(["ترند", "مُولّد"]),
    },
  });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "trend.generate.idea", entity: "Idea", entityId: idea.id, metaJson: d.trendId ? JSON.stringify({ trendId: d.trendId }) : null } });
  revalidatePath("/ideas"); revalidatePath("/trends");
  redirect("/ideas");
}

export async function createIdeaAndScriptFromDraft(formData: FormData): Promise<void> {
  const s = await requireSession();
  try { assertCan(s, "idea.create"); assertCan(s, "script.write"); } catch { return; }
  const d = await resolveDraft(formData);
  if (!d.title) return;
  const creator = await prisma.creator.findFirst({ where: { tenantId: s.tid, deletedAt: null } });
  if (!creator) return;
  const trend = d.trendId ? await prisma.trend.findFirst({ where: { id: d.trendId, tenantId: s.tid, deletedAt: null }, select: { clientScore: true } }) : null;
  const idea = await prisma.idea.create({
    data: {
      tenantId: s.tid, creatorId: creator.id, title: d.title, description: d.description, cta: d.cta,
      status: "scripting", priority: "medium", fitScore: trend?.clientScore ?? 0,
      sourceTrendId: d.trendId, ownerId: s.uid, createdBy: s.uid, tagsJson: JSON.stringify(["ترند", "مُولّد"]),
    },
  });
  const script = await prisma.script.create({
    data: {
      tenantId: s.tid, ideaId: idea.id, title: d.title, hook: d.hook, body: d.shortScript, cta: d.cta,
      description: d.description, hashtagsJson: JSON.stringify(d.hashtags), status: "draft", version: 1, createdBy: s.uid,
    },
  });
  await prisma.auditLog.create({ data: { tenantId: s.tid, userId: s.uid, action: "trend.generate.script", entity: "Script", entityId: script.id, metaJson: JSON.stringify({ ideaId: idea.id, trendId: d.trendId }) } });
  revalidatePath("/ideas"); revalidatePath("/scripts");
  redirect(`/scripts/${script.id}`);
}
