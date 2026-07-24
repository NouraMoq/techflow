import "server-only";
import { prisma } from "@/lib/db";
import { toJson } from "@/lib/json";
import { getTrendProvider } from "./registry";
import { ingestSignals } from "./ingest";
import { loadClientContext } from "./context";
import { runPipeline } from "./pipeline";
import { DEFAULT_GROWTH_WEIGHTS } from "./analysis/weights";
import type { TrendSource, TopicDraft } from "./types";

export type AnalyzeResult = { imported: number; topics: number; trendIds: string[]; note?: string };

/** End-to-end: fetch from a source → ingest → run pipeline → persist Trends. */
export async function analyzeFromSource(
  tenantId: string, source: TrendSource, payload: unknown, createdBy?: string,
): Promise<AnalyzeResult> {
  const fetched = await getTrendProvider(source).fetch(payload); // gated sources throw here
  const signals = await ingestSignals(tenantId, source, fetched.signals, createdBy);
  if (!signals.length) return { imported: 0, topics: 0, trendIds: [], note: fetched.note ?? "لا توجد إشارات صالحة" };

  const client = await loadClientContext(tenantId);
  const ctx = await runPipeline({ tenantId, signals, topics: [], client, weights: DEFAULT_GROWTH_WEIGHTS });

  const trendIds: string[] = [];
  for (const t of ctx.topics) {
    const trend = await persistTopic(tenantId, source, t, createdBy);
    trendIds.push(trend.id);
    await prisma.trendSignal.updateMany({
      where: { id: { in: t.signalIds }, tenantId },
      data: { clusterTrendId: trend.id },
    });
    for (const sv of ctx.signals.filter((x) => t.signalIds.includes(x.id))) {
      await prisma.trendSignal.update({
        where: { id: sv.id },
        data: { keywordsJson: toJson(sv.keywords), topic: sv.topic ?? null, sentiment: sv.sentiment ?? null },
      });
    }
  }
  return { imported: signals.length, topics: ctx.topics.length, trendIds, note: fetched.note };
}

function persistTopic(tenantId: string, source: TrendSource, t: TopicDraft, createdBy?: string) {
  const last = t.metrics.postedAt ? new Date(t.metrics.postedAt) : null;
  return prisma.trend.create({
    data: {
      tenantId, source,
      name: t.name,
      hashtag: t.hashtags[0] ?? null,
      status: "analyzed",
      decision: "studying",
      growthScore: t.growthScore,
      fit: t.fit ?? null,
      risk: t.risk ?? null,
      angle: t.angle ?? null,
      sentiment: t.sentiment,
      competition: t.competition,
      summary: t.summary ?? null,
      story: t.story ?? null,
      whyTrending: t.whyTrending ?? null,
      signalCount: t.signalIds.length,
      lastSeenAt: last,
      firstSeenAt: last,
      clientScore: t.clientScore ?? null,
      confidenceScore: t.confidence ?? null,
      scoreBasisJson: toJson(t.scoreBasis ?? []),
      keywordsJson: toJson(t.keywords),
      subtopicsJson: toJson(t.subtopics),
      questionsJson: toJson(t.questions),
      hooksJson: toJson(t.hooks),
      risksJson: toJson(t.risks),
      opportunitiesJson: toJson(t.opportunities),
      createdBy: createdBy ?? null,
    },
  });
}
