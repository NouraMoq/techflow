import "server-only";
import { prisma } from "@/lib/db";
import { parseObj } from "@/lib/json";
import { keywords } from "./analysis/text";
import type { ClientContext } from "./types";

// Assemble the client context from EXISTING modules (read-only) — the inputs to
// client-fit scoring. No new client system: everything is tenant-scoped.
export async function loadClientContext(tenantId: string): Promise<ClientContext> {
  const [strategy, pillars, questions, sensitive, creator, compItems] = await Promise.all([
    prisma.creatorStrategy.findFirst({ where: { tenantId } }),
    prisma.contentPillar.findMany({ where: { tenantId } }),
    prisma.audienceQuestion.findMany({ where: { tenantId, deletedAt: null }, select: { text: true } }),
    prisma.audienceListItem.findMany({ where: { tenantId, kind: "sensitive" }, select: { text: true } }),
    prisma.creator.findFirst({ where: { tenantId, deletedAt: null }, select: { niche: true } }),
    prisma.complianceItem.findMany({ where: { active: true }, select: { category: true } }),
  ]);

  const persona = parseObj<{ tone?: string; goals?: unknown }>(strategy?.personaJson, {});
  const personaKeywords = keywords(
    [strategy?.vision, strategy?.mission, strategy?.promise, creator?.niche].filter(Boolean).join(" "),
    [],
    20,
  );
  const audienceTopics = questions.flatMap((q) => keywords(q.text, [], 4));
  const crisisSensitive = sensitive.flatMap((s) => keywords(s.text, [], 4));
  const goals = Array.isArray(persona.goals) ? persona.goals.map(String) : [];
  const complianceCategories = [...new Set(compItems.map((c) => c.category).filter((x): x is string => Boolean(x)))];

  return {
    vision: strategy?.vision ?? undefined,
    mission: strategy?.mission ?? undefined,
    promise: strategy?.promise ?? undefined,
    personaKeywords,
    pillars: pillars.map((p) => ({ name: p.name, targetPct: p.targetPct, kpi: p.kpi ?? undefined })),
    audienceTopics,
    complianceCategories,
    crisisSensitive,
    niche: creator?.niche ?? undefined,
    goals,
  };
}
