import "server-only";
import type { TopicExtractor, TrendScorer, ContentGenerator } from "../types";
import { RuleBasedExtractor } from "./topic-extractor";
import { RuleBasedScorer } from "./scorer";
import { RuleBasedGenerator } from "./generator";
import { AiExtractor, AiScorer, AiGenerator, isAiConfigured } from "./ai";

/**
 * Single place that decides which analysis brain to use.
 *
 * Each AI implementation already wraps its rule-based fallback and delegates
 * when ANTHROPIC_API_KEY is absent or a call fails — so returning the AI
 * variant is always safe. We still expose the toggle so callers/telemetry can
 * report which mode is active.
 */
export function aiEnabled(): boolean {
  return isAiConfigured();
}

export const analysisExtractor: TopicExtractor = new AiExtractor(new RuleBasedExtractor());
export const analysisScorer: TrendScorer = new AiScorer(new RuleBasedScorer());
export const analysisGenerator: ContentGenerator = new AiGenerator(new RuleBasedGenerator());
