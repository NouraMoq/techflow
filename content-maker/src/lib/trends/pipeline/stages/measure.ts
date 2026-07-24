import "server-only";
import type { PipelineStage, AnalysisContext, TopicDraft } from "../../types";

function daysBetween(a: string, b: string): number {
  const d = (new Date(a).getTime() - new Date(b).getTime()) / 86400000;
  return Number.isFinite(d) ? d : 0;
}

// Stage 3: measure growth from weighted signals (not just count). Deterministic —
// recency is relative to the newest post in the batch, never "now".
export const measureStage: PipelineStage = {
  name: "measure",
  async run(ctx) {
    const dates = (ctx.signals.map((s) => s.metrics.postedAt).filter(Boolean) as string[]).sort();
    const newest = dates[dates.length - 1];
    const w = ctx.weights;

    for (const t of ctx.topics) {
      const n = t.signalIds.length;
      const m = t.metrics;
      const views = m.views ?? 0;
      const eng = (m.likes ?? 0) + (m.shares ?? 0) + (m.comments ?? 0);

      const velocity = Math.min(1, n / 6);
      const viewsN = Math.min(1, views / 500000);
      const engagement = views > 0 ? Math.min(1, eng / views / 0.15) : Math.min(1, eng / 50000);
      const accounts = Math.min(1, (m.accounts ?? n) / 6);
      const recency = newest && m.postedAt ? Math.max(0, 1 - daysBetween(newest, m.postedAt) / 14) : 0.5;
      const spread = views > 0 ? Math.min(1, (m.shares ?? 0) / views / 0.03) : 0.3;
      const continuity = Math.min(1, topicSpanDays(ctx, t) / 7);

      const score =
        w.velocity * velocity + w.views * viewsN + w.engagement * engagement +
        w.accounts * accounts + w.recency * recency + w.continuity * continuity + w.spread * spread;

      t.growthScore = Math.round(score * 100);
      t.competition = n >= 6 ? "high" : n >= 3 ? "medium" : "low";
    }
    return ctx;
  },
};

function topicSpanDays(ctx: AnalysisContext, t: TopicDraft): number {
  const ds = (ctx.signals.filter((s) => t.signalIds.includes(s.id)).map((s) => s.metrics.postedAt).filter(Boolean) as string[]).sort();
  if (ds.length < 2) return 1;
  return Math.abs(daysBetween(ds[ds.length - 1], ds[0])) || 1;
}
