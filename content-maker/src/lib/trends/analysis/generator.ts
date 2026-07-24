import "server-only";
import type { ContentGenerator, ContentDraft, GenTopic, ClientContext } from "../types";
import { normalizeAr } from "./text";

// Rule-based content generator (Phase 3). Produces several ready briefs from one
// topic + client context. Deterministic. Swap for a model behind ContentGenerator.
export class RuleBasedGenerator implements ContentGenerator {
  readonly name = "rule-based";

  async generate(t: GenTopic, client: ClientContext): Promise<ContentDraft[]> {
    const head = t.name;
    const kw = t.keywords;
    const tags = uniqueTags([...t.hashtags, ...kw.map((k) => "#" + k)]).slice(0, 8);
    const pillar = client.pillars.find((p) =>
      kw.some((k) => normalizeAr(p.name.toLowerCase()).includes(normalizeAr(k)) || normalizeAr(k).includes(normalizeAr(p.name.toLowerCase())))
    );
    const pillarReason = pillar ? ` ويخدم عمود «${pillar.name}».` : "";
    const audienceHit = client.audienceTopics.some((a) => kw.includes(normalizeAr(a)));
    const audReason = audienceHit ? " وجمهورك يسأل عنه فعلًا." : "";

    const angles: { key: string; label: string; goal: string; angle: string; hook: string; body: string; cta: string }[] = [
      {
        key: "educational", label: "تعليمي",
        goal: `تبسيط «${head}» للجمهور بخطوات واضحة`,
        angle: "شرح عملي مباشر",
        hook: t.hooks[0] ?? `${head}؟ إليك ما تحتاج معرفته في دقيقة`,
        body: `افتتاحية بالخطاف، ثم ٣ نقاط سريعة: ${(t.subtopics.length ? t.subtopics : kw).slice(0, 3).join("، ")}، وخاتمة تلخّص الفكرة.`,
        cta: "احفظ الفيديو وشاركه مع من يهمّه",
      },
      {
        key: "opinion", label: "رأي/تجربة",
        goal: `مشاركة رأي/تجربة شخصية حول «${head}»`,
        angle: "زاوية رأي صادقة تبني الثقة",
        hook: `رأيي الصريح في «${head}» بعد تجربة`,
        body: `موقف واضح من الموضوع، سبب الرأي، مثال من تجربتك، ثم دعوة للنقاش في التعليقات.`,
        cta: "قلّي رأيك في التعليقات",
      },
      {
        key: "listicle", label: "قائمة/نصائح",
        goal: `تقديم نصائح عملية مرتبطة بـ«${head}»`,
        angle: "قائمة سريعة سهلة الحفظ",
        hook: `٣ أشياء يجب معرفتها عن «${head}»`,
        body: `تعداد ٣–٥ نقاط قصيرة قابلة للتطبيق فورًا، مع لقطة ختامية تحثّ على الحفظ.`,
        cta: "احفظها لتطبّقها لاحقًا",
      },
    ];

    return angles.map<ContentDraft>((a) => ({
      angleKey: a.key,
      angleLabel: a.label,
      title: `${a.label}: ${head}`,
      goal: a.goal,
      angle: a.angle,
      hook: a.hook,
      shortScript: a.body,
      description: `${a.goal}.${pillarReason}`,
      cta: a.cta,
      hashtags: tags,
      reason: `«${head}» رائج الآن${audReason}${pillarReason} وهذه الزاوية (${a.label}) مناسبة لأسلوب حسابك.`,
    }));
  }
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.startsWith("#") ? raw : "#" + raw;
    const key = normalizeAr(t.toLowerCase());
    if (!seen.has(key)) { seen.add(key); out.push(t); }
  }
  return out;
}

export const defaultGenerator = new RuleBasedGenerator();
