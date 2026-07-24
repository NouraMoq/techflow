import "server-only";
import type { PipelineStage, TopicDraft, SignalView, SignalMetrics, Sentiment } from "../../types";
import { jaccard } from "../../analysis/text";

const THRESHOLD = 0.18; // min keyword overlap to join a cluster

// Stage 2: group similar signals into topics (a topic may span many hashtags).
export const clusterStage: PipelineStage = {
  name: "cluster",
  async run(ctx) {
    const groups: SignalView[][] = [];
    const keys: string[][] = [];
    for (const s of ctx.signals) {
      let best = -1, bestScore = 0;
      for (let i = 0; i < keys.length; i++) {
        const sc = jaccard(s.keywords, keys[i]);
        if (sc > bestScore) { bestScore = sc; best = i; }
      }
      if (best >= 0 && bestScore >= THRESHOLD) {
        groups[best].push(s);
        keys[best] = [...new Set([...keys[best], ...s.keywords])].slice(0, 16);
      } else {
        groups.push([s]);
        keys.push([...s.keywords]);
      }
    }
    ctx.topics = groups.map(toTopic);
    return ctx;
  },
};

function aggKeywords(signals: SignalView[], n: number): string[] {
  const freq = new Map<string, number>();
  for (const s of signals) for (const k of s.keywords) freq.set(k, (freq.get(k) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ar"))
    .slice(0, n).map((e) => e[0]);
}

function majoritySentiment(signals: SignalView[]): Sentiment {
  const c: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
  for (const s of signals) c[(s.sentiment ?? "neutral") as Sentiment]++;
  return (Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]) as Sentiment;
}

function aggMetrics(signals: SignalView[]): SignalMetrics {
  const m: SignalMetrics = { views: 0, likes: 0, shares: 0, comments: 0, accounts: 0 };
  let latest = "";
  for (const s of signals) {
    m.views! += s.metrics.views ?? 0;
    m.likes! += s.metrics.likes ?? 0;
    m.shares! += s.metrics.shares ?? 0;
    m.comments! += s.metrics.comments ?? 0;
    m.accounts! += s.metrics.accounts ?? 1;
    if (s.metrics.postedAt && s.metrics.postedAt > latest) latest = s.metrics.postedAt;
  }
  if (latest) m.postedAt = latest;
  return m;
}

function toTopic(signals: SignalView[]): TopicDraft {
  const kw = aggKeywords(signals, 8);
  const name = kw.slice(0, 3).join(" ") || signals[0].text.slice(0, 40);
  return {
    clusterKey: kw.join("_") || name,
    name,
    keywords: kw,
    hashtags: [...new Set(signals.flatMap((s) => s.hashtags))].slice(0, 10),
    subtopics: [], questions: [], hooks: [], risks: [], opportunities: [],
    sentiment: majoritySentiment(signals),
    competition: "medium",
    growthScore: 0,
    signalIds: signals.map((s) => s.id),
    metrics: aggMetrics(signals),
  };
}
