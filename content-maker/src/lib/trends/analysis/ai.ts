import "server-only";
import type {
  TopicExtractor, TopicSignal,
  TrendScorer, TopicDraft, ClientContext, Band,
  ContentGenerator, ContentDraft, GenTopic, Sentiment,
} from "../types";

/**
 * AI-backed analysis seams (Phase 6).
 *
 * These implement the SAME interfaces as the rule-based analyzers
 * (TopicExtractor / TrendScorer / ContentGenerator), so they drop in with no
 * change to the pipeline. Each wraps a rule-based fallback and delegates to it
 * when the AI is not configured OR on any error — the platform never breaks
 * just because a key is missing.
 *
 * Secrets policy: the Anthropic key is read ONLY here, server-side, from env.
 * It is never sent to the client, never logged, never persisted. This module is
 * `server-only`.
 *
 * No scraping, no third-party data — this only reasons over signals the client
 * already provided/imported. The AI replaces the heuristic "rules"; it does not
 * fetch data.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
// Skill default is Opus 4.8; overridable per-tenant/per-deploy via env (e.g.
// claude-haiku-4-5 for cheaper high-volume extraction). Never hard-code a key.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export function isAiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** One JSON round-trip to Claude. Returns parsed T. Throws on any failure so
 * callers can fall back to rules. Kept small + dependency-free (raw fetch). */
async function askJson<T>(system: string, user: string, maxTokens = 1200): Promise<T> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI not configured");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
    // Keep the pipeline responsive; fall back to rules if the model is slow.
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  return parseJson<T>(text);
}

/** Tolerant JSON extraction — models occasionally wrap JSON in prose/fences. */
function parseJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const arr = body.indexOf("[");
  const from = start === -1 ? arr : arr === -1 ? start : Math.min(start, arr);
  if (from === -1) throw new Error("no JSON in response");
  const openCh = body[from];
  const closeCh = openCh === "{" ? "}" : "]";
  const to = body.lastIndexOf(closeCh);
  if (to <= from) throw new Error("truncated JSON");
  return JSON.parse(body.slice(from, to + 1)) as T;
}

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative", "mixed"];
const BANDS: Band[] = ["low", "medium", "high"];
function asSentiment(v: unknown): Sentiment { return SENTIMENTS.includes(v as Sentiment) ? (v as Sentiment) : "neutral"; }
function asBand(v: unknown): Band { return BANDS.includes(v as Band) ? (v as Band) : "medium"; }
function asStrings(v: unknown, max = 12): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max) : [];
}
function clamp(n: unknown, a = 0, b = 100): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? Math.max(a, Math.min(b, Math.round(x))) : Math.round((a + b) / 2);
}

// ---- Topic extraction ---------------------------------------------------

export class AiExtractor implements TopicExtractor {
  constructor(private fallback: TopicExtractor) {}
  async extract(text: string, hashtags: string[]): Promise<TopicSignal> {
    if (!isAiConfigured()) return this.fallback.extract(text, hashtags);
    try {
      const system =
        "أنت محلّل محتوى عربي. استخرج جوهر المنشور. أعِد JSON فقط بالمفاتيح: " +
        `topic (اسم الموضوع باختصار), keywords (مصفوفة كلمات مفتاحية بالعربية بلا رمز #), ` +
        `sentiment (واحدة من: positive|neutral|negative|mixed), question (سؤال الجمهور الضمني أو null), ` +
        `contentType (tutorial|qa|general). لا تشرح، JSON فقط.`;
      const user = `النص:\n${text}\n\nالهاشتاقات: ${hashtags.join(" ") || "لا يوجد"}`;
      const r = await askJson<Record<string, unknown>>(system, user, 500);
      const kw = asStrings(r.keywords, 8);
      return {
        topic: (typeof r.topic === "string" && r.topic.trim()) || kw.slice(0, 3).join(" ") || (hashtags[0] ?? text.slice(0, 40)),
        keywords: kw.length ? kw : (await this.fallback.extract(text, hashtags)).keywords,
        sentiment: asSentiment(r.sentiment),
        question: typeof r.question === "string" && r.question.trim() ? r.question.trim() : undefined,
        contentType: typeof r.contentType === "string" ? r.contentType : "general",
      };
    } catch {
      return this.fallback.extract(text, hashtags);
    }
  }
}

// ---- Client-fit scoring -------------------------------------------------

export class AiScorer implements TrendScorer {
  constructor(private fallback: TrendScorer) {}
  async score(topic: TopicDraft, client: ClientContext): Promise<{ score: number; basis: string[]; fit: Band }> {
    if (!isAiConfigured()) return this.fallback.score(topic, client);
    try {
      const system =
        "أنت استراتيجي محتوى. قيّم مدى ملاءمة ترند لعميل بعينه بناءً على استراتيجيته وجمهوره وضوابطه. " +
        "أعِد JSON فقط: score (0-100 ملاءمة)، fit (low|medium|high)، basis (مصفوفة أسباب موجزة بالعربية، " +
        "اذكر تقاطعات فعلية مع الاستراتيجية/الأعمدة/الجمهور، ونبّه إذا تقاطع مع كلمات حساسة). " +
        "كن صادقًا: إن لم تكن الملاءمة قوية اخفض الدرجة. JSON فقط.";
      const user = JSON.stringify({
        trend: {
          name: topic.name, keywords: topic.keywords, subtopics: topic.subtopics,
          questions: topic.questions, sentiment: topic.sentiment,
          competition: topic.competition, growthScore: topic.growthScore,
        },
        client: {
          vision: client.vision, mission: client.mission, promise: client.promise,
          niche: client.niche, personaKeywords: client.personaKeywords,
          pillars: client.pillars.map((p) => p.name), audienceTopics: client.audienceTopics,
          goals: client.goals, complianceCategories: client.complianceCategories,
          crisisSensitive: client.crisisSensitive,
        },
      });
      const r = await askJson<Record<string, unknown>>(system, user, 800);
      const basis = asStrings(r.basis, 6);
      return {
        score: clamp(r.score),
        basis: basis.length ? basis : ["تقييم بالذكاء الاصطناعي دون أسباب مفصّلة"],
        fit: asBand(r.fit),
      };
    } catch {
      return this.fallback.score(topic, client);
    }
  }
}

// ---- Content generation -------------------------------------------------

export class AiGenerator implements ContentGenerator {
  readonly name = "ai";
  constructor(private fallback: ContentGenerator) {}
  async generate(topic: GenTopic, client: ClientContext): Promise<ContentDraft[]> {
    if (!isAiConfigured()) return this.fallback.generate(topic, client);
    try {
      const system =
        "أنت صانع محتوى عربي محترف. حوّل ترندًا إلى ثلاث مقترحات محتوى جاهزة بزوايا مختلفة: " +
        "educational (تعليمي)، opinion (رأي/تجربة)، listicle (قائمة/نصائح). " +
        "لكل مقترح أعِد كائنًا بالمفاتيح: angleKey (educational|opinion|listicle)، angleLabel (بالعربية)، " +
        "title، goal، angle، hook (جملة افتتاحية جذّابة)، shortScript (سكربت قصير ٣-٥ جمل)، description، " +
        "cta، hashtags (مصفوفة تبدأ بـ#)، reason (لماذا تناسب هذا الحساب). " +
        "احترم هوية العميل وضوابطه. أعِد JSON: مصفوفة من ٣ كائنات فقط.";
      const user = JSON.stringify({
        topic: {
          name: topic.name, keywords: topic.keywords, hashtags: topic.hashtags,
          hooks: topic.hooks, subtopics: topic.subtopics, questions: topic.questions,
          sentiment: topic.sentiment, angle: topic.angle,
        },
        client: {
          vision: client.vision, mission: client.mission, promise: client.promise,
          niche: client.niche, personaKeywords: client.personaKeywords,
          pillars: client.pillars.map((p) => p.name), audienceTopics: client.audienceTopics,
          crisisSensitive: client.crisisSensitive,
        },
      });
      const arr = await askJson<Record<string, unknown>[]>(system, user, 2200);
      if (!Array.isArray(arr) || !arr.length) return this.fallback.generate(topic, client);
      const drafts = arr.map<ContentDraft>((d) => ({
        angleKey: typeof d.angleKey === "string" ? d.angleKey : "educational",
        angleLabel: typeof d.angleLabel === "string" ? d.angleLabel : "تعليمي",
        title: str(d.title, topic.name),
        goal: str(d.goal, ""),
        angle: str(d.angle, ""),
        hook: str(d.hook, ""),
        shortScript: str(d.shortScript, ""),
        description: str(d.description, ""),
        cta: str(d.cta, ""),
        hashtags: normTags(asStrings(d.hashtags, 8), topic),
        reason: str(d.reason, ""),
      }));
      return drafts;
    } catch {
      return this.fallback.generate(topic, client);
    }
  }
}

function str(v: unknown, fb: string): string { return typeof v === "string" && v.trim() ? v.trim() : fb; }
function normTags(tags: string[], topic: GenTopic): string[] {
  const base = tags.length ? tags : [...topic.hashtags, ...topic.keywords.map((k) => "#" + k)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of base) {
    const t = raw.startsWith("#") ? raw : "#" + raw;
    if (!seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out.slice(0, 8);
}
