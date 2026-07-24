// Trend Intelligence — stable core contracts.
// Pure types (no runtime): safe to import anywhere. Implementations are `server-only`.

export type TrendSource =
  | "manual" | "mock" | "csv" | "json"
  | "google_trends" | "creative_center" | "official_tiktok" | "licensed";

export type ProviderMode = "manual" | "imported" | "mock" | "live";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";
export type Band = "low" | "medium" | "high";

export interface SignalMetrics {
  views?: number; likes?: number; shares?: number; comments?: number;
  accounts?: number; postedAt?: string; // ISO date
}

/** Neutral DTO returned by a provider — not persisted yet. */
export interface RawSignal {
  externalRef?: string;   // public id/url — never a secret
  text: string;
  hashtags?: string[];
  lang?: string;
  metrics?: SignalMetrics;
}

export interface FetchResult {
  source: TrendSource;
  mode: ProviderMode;
  signals: RawSignal[];
  note?: string;
}

/** The one contract every data source implements. Nothing else knows the source. */
export interface TrendDataProvider {
  readonly source: TrendSource;
  readonly mode: ProviderMode;
  fetch(payload?: unknown): Promise<FetchResult>;
}

export class TrendSourceNotConfiguredError extends Error {
  constructor(source: string) {
    super(`Trend source "${source}" is not configured (missing credentials/approval).`);
    this.name = "TrendSourceNotConfiguredError";
  }
}

// ---- Pipeline ----

/** In-memory view of an ingested TrendSignal row. */
export interface SignalView {
  id: string;
  source: TrendSource;
  text: string;
  hashtags: string[];
  keywords: string[];
  lang?: string;
  metrics: SignalMetrics;
  topic?: string;
  sentiment?: Sentiment;
}

/** A topic built up by the pipeline stages → persisted as a Trend. */
export interface TopicDraft {
  clusterKey: string;
  name: string;
  summary?: string;
  story?: string;
  whyTrending?: string;
  keywords: string[];
  hashtags: string[];
  subtopics: string[];
  questions: string[];
  hooks: string[];
  risks: string[];
  opportunities: string[];
  sentiment: Sentiment;
  competition: Band;
  growthScore: number;      // 0..100
  signalIds: string[];
  metrics: SignalMetrics;   // aggregated across signals
  clientScore?: number;     // 0..100
  scoreBasis?: string[];
  fit?: Band;
  risk?: Band;
  angle?: string;
}

/** Client context assembled from existing modules — read-only inputs to scoring. */
export interface ClientContext {
  vision?: string;
  mission?: string;
  promise?: string;
  personaKeywords: string[];
  pillars: { name: string; targetPct: number; kpi?: string }[];
  audienceTopics: string[];
  complianceCategories: string[]; // active guardrail categories
  crisisSensitive: string[];      // sensitive words / forbidden topics
  niche?: string;
  goals: string[];
}

export interface GrowthWeights {
  velocity: number; views: number; engagement: number;
  accounts: number; recency: number; continuity: number; spread: number;
}

export interface AnalysisContext {
  tenantId: string;
  signals: SignalView[];
  topics: TopicDraft[];
  client: ClientContext;
  weights: GrowthWeights;
}

/** A composable analysis step: pure ctx → ctx. Add new ones without touching others. */
export interface PipelineStage {
  readonly name: string;
  run(ctx: AnalysisContext): Promise<AnalysisContext>;
}

// ---- AI-swappable analysis seams (rule-based now, model-backed later) ----

export interface TopicSignal {
  topic: string;
  keywords: string[];
  sentiment: Sentiment;
  question?: string;
  contentType?: string;
}
export interface TopicExtractor {
  extract(text: string, hashtags: string[]): Promise<TopicSignal>;
}
export interface TrendScorer {
  score(topic: TopicDraft, client: ClientContext): Promise<{ score: number; basis: string[]; fit: Band }>;
}
