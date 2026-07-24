import "server-only";
import type { PipelineStage } from "../../types";
import { defaultExtractor } from "../../analysis/topic-extractor";

// Stage 1: understand each signal — topic, keywords, sentiment.
export const extractTopicStage: PipelineStage = {
  name: "extract-topic",
  async run(ctx) {
    for (const s of ctx.signals) {
      const t = await defaultExtractor.extract(s.text, s.hashtags);
      s.keywords = t.keywords;
      s.topic = t.topic;
      s.sentiment = t.sentiment;
    }
    return ctx;
  },
};
