import "server-only";
import type { PipelineStage, TopicDraft } from "../../types";
import { SENTIMENT_LABEL, COMPETITION_LABEL } from "../../labels";

// Stage 4: build the human-facing story/analysis (rule-based templates over the
// clustered data). A model-backed enricher can replace this behind the stage API.
export const enrichStage: PipelineStage = {
  name: "enrich",
  async run(ctx) {
    for (const t of ctx.topics) enrich(t);
    return ctx;
  },
};

function enrich(t: TopicDraft) {
  const kw = t.keywords;
  const head = t.name;
  t.summary = `موضوع رائج حول «${head}» — ${t.signalIds.length} إشارة، النبرة ${SENTIMENT_LABEL[t.sentiment]}، المنافسة ${COMPETITION_LABEL[t.competition]}.`;
  t.story = `بدأ الحديث عن «${head}» ثم توسّع عبر عدة منشورات تشترك في: ${kw.slice(0, 5).join("، ")}.`;
  t.whyTrending =
    t.sentiment === "negative" ? "ينتشر بدافع الجدل أو القلق حول الموضوع." :
    t.sentiment === "positive" ? "ينتشر لأنه مفيد وسهل التطبيق ويشجّع على المشاركة." :
    "ينتشر لتوقيته وتكرار طرحه من حسابات متعددة.";
  t.subtopics = kw.slice(3, 8);
  t.questions = [
    `ما قصة «${head}»؟`,
    `لماذا انتشر «${head}» الآن؟`,
    `هل «${head}» ما زال في الصعود؟`,
  ];
  t.hooks = [
    `${head}؟ إليك ما لا تعرفه`,
    `الجميع يتحدث عن ${kw[0] ?? head} — وهذا رأيي`,
    `٣ أشياء يجب معرفتها عن ${head}`,
  ];
  t.risks = t.sentiment === "negative"
    ? ["الموضوع حسّاس/جدلي — راجع النبرة قبل النشر", "تأكّد من دقة المعلومة لتجنّب الجدل"]
    : ["احتمال تشبّع إذا تأخّر النشر"];
  t.opportunities = [
    `زاوية تعليمية تشرح «${head}»`,
    "زاوية رأي أو تجربة شخصية",
    t.competition === "low" ? "منافسة منخفضة — فرصة للسبق" : "أضف زاوية مختلفة لتبرز وسط المنافسة",
  ];
  t.angle = t.opportunities[0];
  t.risk = t.sentiment === "negative" ? "high" : t.competition === "high" ? "medium" : "low";
}
