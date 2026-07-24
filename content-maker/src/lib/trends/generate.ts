import "server-only";
import { prisma } from "@/lib/db";
import { parseArr } from "@/lib/json";
import { loadClientContext } from "./context";
import { defaultGenerator } from "./analysis/generator";
import type { ContentDraft, GenTopic, Sentiment } from "./types";

/** Generate several ready content briefs from an analyzed Trend. */
export async function generateFromTrend(
  tenantId: string, trendId: string,
): Promise<{ topicName: string; drafts: ContentDraft[] } | null> {
  const t = await prisma.trend.findFirst({ where: { id: trendId, tenantId, deletedAt: null } });
  if (!t) return null;
  const topic: GenTopic = {
    name: t.name,
    keywords: parseArr(t.keywordsJson),
    hashtags: t.hashtag ? [t.hashtag] : [],
    hooks: parseArr(t.hooksJson),
    subtopics: parseArr(t.subtopicsJson),
    questions: parseArr(t.questionsJson),
    sentiment: (t.sentiment as Sentiment) ?? "neutral",
    angle: t.angle ?? undefined,
  };
  const client = await loadClientContext(tenantId);
  const drafts = await defaultGenerator.generate(topic, client);
  return { topicName: t.name, drafts };
}
