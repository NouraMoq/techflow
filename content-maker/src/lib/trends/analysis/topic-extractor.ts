import "server-only";
import type { TopicExtractor, TopicSignal } from "../types";
import { keywords, sentiment } from "./text";

// Rule-based topic extractor (Phase 1). Swap for a model-backed one later by
// implementing the same TopicExtractor interface — nothing else changes.
export class RuleBasedExtractor implements TopicExtractor {
  async extract(text: string, hashtags: string[]): Promise<TopicSignal> {
    const kw = keywords(text, hashtags, 8);
    // Heuristic topic name = the 2–3 most salient keywords.
    const topic = kw.slice(0, 3).join(" ") || (hashtags[0] ?? text.slice(0, 40));
    const contentType = /كيف|طريقة|شرح|خطوات|how/i.test(text)
      ? "tutorial"
      : /\?|؟|ايش|وش|هل|لماذا/i.test(text)
      ? "qa"
      : "general";
    const q = text.split(/[.!؟?\n]/).find((s) => /\?|؟|كيف|لماذا|هل|وش|ايش/i.test(s));
    return {
      topic,
      keywords: kw,
      sentiment: sentiment(text),
      question: q?.trim() || undefined,
      contentType,
    };
  }
}

export const defaultExtractor = new RuleBasedExtractor();
