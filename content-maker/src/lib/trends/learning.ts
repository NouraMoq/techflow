import "server-only";
import { prisma } from "@/lib/db";
import { SENTIMENT_LABEL } from "./labels";
import { trendPerformanceRanking } from "./performance";

// How far a resulting idea progressed = success proxy (until real publish analytics exist).
const PROGRESS: Record<string, number> = {
  draft: 0, research: 0, proposed: 1, approved: 1,
  scripting: 2, scheduled: 3, production: 4, published: 5,
  postponed: 0, rejected: -1, archived: 0,
};
const WON_THRESHOLD = 2; // reached scripting or beyond

export type WinningInsight = {
  hasSignal: boolean;
  actedCount: number;
  wonCount: number;
  topValue: string | null;   // dominant sentiment
  topLabel: string | null;
  progressed: boolean;
  basis: string[];
  text: string | null;
};

const EMPTY: WinningInsight = {
  hasSignal: false, actedCount: 0, wonCount: 0, topValue: null, topLabel: null, progressed: false, basis: [], text: null,
};

/**
 * Learn which trend characteristics tend to succeed for THIS client, from real
 * data: trends that were actioned (Idea.sourceTrendId) and how far their ideas
 * progressed. Gated on a minimum sample — never fabricates a pattern.
 */
// Preferred signal: REAL published performance (closes the loop).
async function performanceInsight(tenantId: string): Promise<WinningInsight | null> {
  const rows = await trendPerformanceRanking(tenantId);
  if (rows.length < 2) return null;
  const avg = rows.reduce((s, r) => s + r.avgEngagementPct, 0) / rows.length;
  const top = rows.filter((r) => r.avgEngagementPct >= avg);
  const bySent: Record<string, { count: number; eng: number }> = {};
  for (const r of top) {
    const s = r.sentiment ?? "neutral";
    bySent[s] = bySent[s] ?? { count: 0, eng: 0 };
    bySent[s].count++; bySent[s].eng += r.avgEngagementPct;
  }
  const topValue = Object.entries(bySent).sort((a, b) => b[1].count - a[1].count || b[1].eng - a[1].eng)[0][0];
  const best = rows[0];
  return {
    hasSignal: true, actedCount: rows.length, wonCount: top.length, topValue,
    topLabel: SENTIMENT_LABEL[topValue] ?? topValue, progressed: true,
    basis: [
      `${rows.length} ترند لديه بيانات أداء منشورة`,
      `أعلى أداءً: «${best.name}» بمتوسط تفاعل ${best.avgEngagementPct}٪`,
      `النبرة الغالبة في الأعلى أداءً: ${SENTIMENT_LABEL[topValue] ?? topValue}`,
    ],
    text: `بناءً على الأداء الفعلي: ترنداتك ذات النبرة «${SENTIMENT_LABEL[topValue] ?? topValue}» تحقق أفضل تفاعل. أعطِ الأولوية للترندات المشابهة.`,
  };
}

export async function learnWinningTrends(tenantId: string): Promise<WinningInsight> {
  const perf = await performanceInsight(tenantId);
  if (perf) return perf; // real performance beats the idea-progress proxy

  const ideas = await prisma.idea.findMany({
    where: { tenantId, deletedAt: null, sourceTrendId: { not: null } },
    select: { sourceTrendId: true, status: true },
  });
  if (!ideas.length) return EMPTY;

  // Best progress reached per source trend.
  const bestByTrend = new Map<string, number>();
  for (const i of ideas) {
    const p = PROGRESS[i.status] ?? 0;
    if (p > (bestByTrend.get(i.sourceTrendId!) ?? -99)) bestByTrend.set(i.sourceTrendId!, p);
  }
  const trends = await prisma.trend.findMany({
    where: { id: { in: [...bestByTrend.keys()] }, tenantId, deletedAt: null },
    select: { id: true, sentiment: true },
  });
  const actedCount = trends.length;
  if (actedCount < 2) return EMPTY; // not enough signal yet

  const acted: Record<string, number> = {};
  const won: Record<string, number> = {};
  let wonCount = 0;
  for (const t of trends) {
    const sent = t.sentiment ?? "neutral";
    acted[sent] = (acted[sent] ?? 0) + 1;
    if ((bestByTrend.get(t.id) ?? 0) >= WON_THRESHOLD) { won[sent] = (won[sent] ?? 0) + 1; wonCount++; }
  }
  const progressed = wonCount > 0;
  const pool = progressed ? won : acted;
  const topValue = Object.entries(pool).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const topLabel = SENTIMENT_LABEL[topValue] ?? topValue;

  const basis = [
    `الترندات المُنفَّذة: ${actedCount}`,
    progressed ? `منها ${wonCount} وصلت للسيناريو/الإنتاج` : "لم تصل بعد لمراحل متقدمة",
    `النبرة الغالبة في ${progressed ? "الناجحة" : "المُنفَّذة"}: ${topLabel}`,
  ];
  const text = progressed
    ? `ترنداتك ذات النبرة «${topLabel}» أنتجت محتوى وصل لمراحل متقدمة (${won[topValue]}). أعطِ الأولوية للترندات المشابهة.`
    : `أكثر ما تنفّذه ترندات ذات نبرة «${topLabel}» — واصل التركيز عليها، وتابع أداءها بعد النشر لتدقيق التوصية.`;

  return { hasSignal: true, actedCount, wonCount, topValue, topLabel, progressed, basis, text };
}
