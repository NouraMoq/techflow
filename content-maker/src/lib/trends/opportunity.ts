import "server-only";
import { prisma } from "@/lib/db";
import { parseArr } from "@/lib/json";
import { keywords } from "./analysis/text";
import type { OpportunityDraft, OpportunityDetector } from "./types";

// Detector A: opportunities derived from an analyzed Trend (good fit, not high competition/risk).
const trendDetector: OpportunityDetector = {
  name: "trend-derived",
  async detect(tenantId) {
    const trends = await prisma.trend.findMany({
      where: { tenantId, deletedAt: null, status: "analyzed" },
      select: { id: true, name: true, fit: true, risk: true, competition: true, clientScore: true, confidenceScore: true },
    });
    const out: OpportunityDraft[] = [];
    for (const t of trends) {
      if (t.risk === "high") continue;
      const fitOk = t.fit === "high" || t.fit === "medium" || (t.clientScore ?? 0) >= 45;
      if (!fitOk || t.competition === "high") continue;
      out.push({
        key: `trend:${t.id}`,
        title: `محتوى عن: ${t.name}`,
        kind: "from_trend",
        trendId: t.id,
        reason: `ترند ملائم (${t.clientScore ?? 0}%) بمنافسة ${t.competition === "low" ? "منخفضة" : "متوسطة"} — فرصة جيدة.`,
        score: t.clientScore ?? 0,
        confidence: t.confidenceScore ?? undefined,
      });
    }
    return out;
  },
};

// Detector B: opportunities from an AUDIENCE GAP — rising questions with low competition,
// even before a trend forms. This is the level-3 value the two-level model couldn't give.
const audienceGapDetector: OpportunityDetector = {
  name: "audience-gap",
  async detect(tenantId) {
    const [questions, hotTrends] = await Promise.all([
      prisma.audienceQuestion.findMany({
        where: { tenantId, deletedAt: null, status: { in: ["new", "answered"] } },
        select: { id: true, text: true, count: true },
      }),
      prisma.trend.findMany({ where: { tenantId, deletedAt: null, competition: "high" }, select: { keywordsJson: true } }),
    ]);
    const hotKw = new Set(hotTrends.flatMap((t) => parseArr(t.keywordsJson)));
    const out: OpportunityDraft[] = [];
    for (const q of questions) {
      if ((q.count ?? 1) < 2) continue; // rising demand only
      const competitive = keywords(q.text, [], 6).some((k) => hotKw.has(k));
      if (competitive) continue; // keep only low-competition gaps
      out.push({
        key: `q:${q.id}`,
        title: `أجب طلب جمهورك: ${q.text.slice(0, 46)}`,
        kind: "audience_gap",
        sourceQuestionId: q.id,
        reason: `طلب متزايد (${q.count} مرة) لدى جمهورك ومنافسة منخفضة — فرصة قبل تشكّل الترند.`,
        score: Math.min(90, 48 + (q.count ?? 1) * 8),
        confidence: 55,
      });
    }
    return out;
  },
};

// Add new detectors here — the rest of the system is untouched.
export const OPPORTUNITY_DETECTORS: OpportunityDetector[] = [trendDetector, audienceGapDetector];

/** Run all detectors and upsert TrendOpportunity rows (idempotent by key). Returns count. */
export async function detectOpportunities(tenantId: string, createdBy?: string): Promise<number> {
  const drafts = (await Promise.all(OPPORTUNITY_DETECTORS.map((d) => d.detect(tenantId)))).flat();
  for (const d of drafts) {
    await prisma.trendOpportunity.upsert({
      where: { tenantId_key: { tenantId, key: d.key } },
      update: { title: d.title, kind: d.kind, trendId: d.trendId ?? null, sourceQuestionId: d.sourceQuestionId ?? null, reason: d.reason, score: d.score, confidence: d.confidence ?? null },
      create: { tenantId, key: d.key, title: d.title, kind: d.kind, trendId: d.trendId ?? null, sourceQuestionId: d.sourceQuestionId ?? null, reason: d.reason, score: d.score, confidence: d.confidence ?? null, createdBy: createdBy ?? null },
    });
  }
  return drafts.length;
}
