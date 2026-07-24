import "server-only";
import { prisma } from "@/lib/db";

export type TrendPerfRow = {
  trendId: string; name: string; sentiment: string | null;
  contentCount: number; totalViews: number; avgEngagementPct: number;
};
type Metric = { views: number; likes: number; shares: number; comments: number; saves: number };

function engPct(p: Metric): number {
  const e = p.likes + p.shares + p.comments + p.saves;
  return p.views > 0 ? (e / p.views) * 100 : 0;
}

/** Record performance for a published idea (manual/import — no scraping). */
export async function recordPerformance(
  tenantId: string, ideaId: string, m: Partial<Metric> & { publishedUrl?: string }, createdBy?: string,
): Promise<boolean> {
  const idea = await prisma.idea.findFirst({ where: { id: ideaId, tenantId, deletedAt: null }, select: { id: true, sourceTrendId: true } });
  if (!idea) return false;
  await prisma.contentPerformance.create({
    data: {
      tenantId, ideaId: idea.id, sourceTrendId: idea.sourceTrendId ?? null, source: "manual",
      views: m.views ?? 0, likes: m.likes ?? 0, shares: m.shares ?? 0, comments: m.comments ?? 0, saves: m.saves ?? 0,
      publishedUrl: m.publishedUrl ?? null, createdBy: createdBy ?? null,
    },
  });
  return true;
}

/** "Which trends performed best" — aggregated engagement per trend, ranked. */
export async function trendPerformanceRanking(tenantId: string): Promise<TrendPerfRow[]> {
  const perfs = await prisma.contentPerformance.findMany({
    where: { tenantId, sourceTrendId: { not: null } },
    select: { sourceTrendId: true, views: true, likes: true, shares: true, comments: true, saves: true },
  });
  if (!perfs.length) return [];
  const byTrend = new Map<string, { views: number; engSum: number; count: number }>();
  for (const p of perfs) {
    const cur = byTrend.get(p.sourceTrendId!) ?? { views: 0, engSum: 0, count: 0 };
    cur.views += p.views; cur.engSum += engPct(p); cur.count++;
    byTrend.set(p.sourceTrendId!, cur);
  }
  const trends = await prisma.trend.findMany({
    where: { id: { in: [...byTrend.keys()] }, tenantId, deletedAt: null },
    select: { id: true, name: true, sentiment: true },
  });
  return trends
    .map<TrendPerfRow>((t) => {
      const a = byTrend.get(t.id)!;
      return { trendId: t.id, name: t.name, sentiment: t.sentiment, contentCount: a.count, totalViews: a.views, avgEngagementPct: Math.round((a.engSum / a.count) * 10) / 10 };
    })
    .sort((x, y) => y.avgEngagementPct - x.avgEngagementPct || y.totalViews - x.totalViews);
}

/** Trend-derived content ready to record performance for (reached scripting+). */
export async function trendContentForPerformance(tenantId: string) {
  return prisma.idea.findMany({
    where: { tenantId, deletedAt: null, sourceTrendId: { not: null }, status: { in: ["scripting", "scheduled", "production", "published"] } },
    select: { id: true, title: true, status: true, _count: { select: { performances: true } } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}
