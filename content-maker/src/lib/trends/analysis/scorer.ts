import "server-only";
import type { TrendScorer, TopicDraft, ClientContext, Band } from "../types";
import { normalizeAr } from "./text";

function clamp(n: number, a = 0, b = 100) { return Math.max(a, Math.min(b, n)); }
function overlap(a: string[], b: string[]): string[] {
  const B = new Set(b.map((x) => normalizeAr(x.toLowerCase())));
  return a.filter((x) => B.has(normalizeAr(x.toLowerCase())));
}

// Rule-based client-fit scorer (Phase 1). Reads REAL client context; records a
// human-readable basis (like recommendations-engine). Swap for AI via the interface.
export class RuleBasedScorer implements TrendScorer {
  async score(topic: TopicDraft, client: ClientContext): Promise<{ score: number; basis: string[]; fit: Band }> {
    const basis: string[] = [];
    let score = 40; // neutral base

    const persona = overlap(topic.keywords, client.personaKeywords);
    if (persona.length) { score += Math.min(25, persona.length * 8); basis.push(`يخدم هوية العميل (${persona.slice(0, 3).join("، ")})`); }

    const pillar = client.pillars.find((p) =>
      overlap(topic.keywords, [p.name, ...(p.kpi ? [p.kpi] : [])].flatMap((s) => s.split(/\s+/))).length > 0
    );
    if (pillar) { score += 15; basis.push(`يقع ضمن عمود المحتوى: ${pillar.name}`); }

    const audience = overlap(topic.keywords, client.audienceTopics);
    if (audience.length) { score += 15; basis.push("يجيب طلبًا متكررًا لدى الجمهور"); }

    if (topic.growthScore >= 60) { score += Math.min(10, Math.round(topic.growthScore / 10)); basis.push(`زخم نمو مرتفع (${topic.growthScore}%)`); }

    // Guardrails (reduce score / flag).
    const sensitive = overlap(topic.keywords, client.crisisSensitive);
    if (sensitive.length) { score -= 30; basis.push("⚠️ يتقاطع مع كلمات حسّاسة — راجع «السمعة والأزمات» قبل الإنتاج"); }
    if (topic.sentiment === "negative") { score -= 10; basis.push("النبرة السائدة سلبية — تعامل بحذر"); }
    if (!basis.length) basis.push("ملاءمة عامة — لا إشارات قوية للربط بالاستراتيجية");

    score = clamp(score);
    const fit: Band = score >= 70 ? "high" : score >= 45 ? "medium" : "low";
    return { score, basis, fit };
  }
}

export const defaultScorer = new RuleBasedScorer();
