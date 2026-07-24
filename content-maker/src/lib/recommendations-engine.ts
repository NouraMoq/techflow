import "server-only";
import { prisma } from "./db";
import { learnWinningTrends } from "./trends/learning";

// ============================================================================
// Rule-based recommendation engine. Every recommendation is DERIVED from the
// tenant's own data — the `basis` field records exactly what triggered it.
// No fabricated numbers, no external claims. Returns upsert payloads keyed by a
// stable `key` so regenerating doesn't create duplicates.
// ============================================================================
export type GeneratedRec = {
  key: string;
  text: string;
  basis: string;
  confidence: "high" | "medium" | "low";
  category: string;
  ownerRole: string;
};

export async function generateRecommendations(tenantId: string): Promise<GeneratedRec[]> {
  const recs: GeneratedRec[] = [];

  const [pillars, trends, invoices, obligations, ideas, publishedJobs] = await Promise.all([
    prisma.contentPillar.findMany({ where: { tenantId } }),
    prisma.trend.findMany({ where: { tenantId, deletedAt: null } }),
    prisma.invoice.findMany({ where: { tenantId } }),
    prisma.contractObligation.findMany({ where: { contract: { tenantId } } }),
    prisma.idea.findMany({ where: { tenantId, deletedAt: null }, include: { scripts: true } }),
    prisma.publishJob.count({ where: { tenantId, status: "published" } }),
  ]);

  // 1) Pillar balance
  const total = pillars.reduce((s, p) => s + p.targetPct, 0);
  if (pillars.length && total !== 100) {
    recs.push({
      key: "pillar_balance", category: "strategy", confidence: "high", ownerRole: "content",
      text: `أعِد توازن أعمدة المحتوى — المجموع الحالي ${total}٪ بدل ١٠٠٪.`,
      basis: `مجموع نسب ${pillars.length} أعمدة = ${total}٪`,
    });
  }

  // 2) Trend about to expire but still "studying"
  const now = Date.now();
  const expiring = trends.filter((t) => t.decision === "studying" && t.expiresAt && (new Date(t.expiresAt).getTime() - now) / 86400000 < 6);
  if (expiring.length) {
    recs.push({
      key: "trend_expiring", category: "trend", confidence: "high", ownerRole: "creator",
      text: `احسم قرار الترند "${expiring[0].name}" قبل انتهائه — الوقت يضيق.`,
      basis: `${expiring.length} ترند "قيد الدراسة" ينتهي خلال < ٦ أيام`,
    });
  }

  // 3) Overdue invoices
  const overdue = invoices.filter((i) => i.status === "overdue");
  if (overdue.length) {
    recs.push({
      key: "overdue_invoice", category: "finance", confidence: "high", ownerRole: "biz",
      text: `تابع تحصيل ${overdue.length} فاتورة متأخرة (${overdue.map((i) => i.number).join("، ")}).`,
      basis: `${overdue.length} فاتورة بحالة "متأخرة"`,
    });
  }

  // 4) Contract obligations open & overdue
  const openObl = obligations.filter((o) => o.status === "overdue" || (o.status === "open" && o.dueDate && (new Date(o.dueDate).getTime() - now) / 86400000 < 5));
  if (openObl.length) {
    recs.push({
      key: "obligation_due", category: "contracts", confidence: "medium", ownerRole: "biz",
      text: `عالج ${openObl.length} التزامًا تعاقديًا قريب الاستحقاق قبل تجاوز الموعد.`,
      basis: `${openObl.length} التزام متأخر أو يستحق خلال < ٥ أيام`,
    });
  }

  // 5) Approved ideas without a script yet
  const approvedNoScript = ideas.filter((i) => i.status === "approved" && i.scripts.length === 0);
  if (approvedNoScript.length) {
    recs.push({
      key: "idea_needs_script", category: "production", confidence: "medium", ownerRole: "writer",
      text: `ابدأ كتابة السيناريو لـ ${approvedNoScript.length} فكرة معتمدة دون سيناريو.`,
      basis: `${approvedNoScript.length} فكرة معتمدة بلا سيناريو مرتبط`,
    });
  }

  // 6) High-fit ideas not yet approved (opportunity)
  const highFitPending = ideas.filter((i) => i.fitScore >= 88 && ["draft", "proposed", "research"].includes(i.status));
  if (highFitPending.length) {
    recs.push({
      key: "high_fit_idea", category: "strategy", confidence: "medium", ownerRole: "content",
      text: `اعتمد أفكارًا عالية الملاءمة (${highFitPending.length}) للاستفادة من توافقها مع الهوية.`,
      basis: `${highFitPending.length} فكرة بملاءمة ≥ ٨٨٪ لم تُعتمد بعد`,
    });
  }

  // 7) Low published volume nudge
  if (publishedJobs < 4) {
    recs.push({
      key: "publish_volume", category: "growth", confidence: "low", ownerRole: "content",
      text: "ارفع وتيرة النشر — عدد المنشورات المؤكَّدة هذا الشهر منخفض.",
      basis: `${publishedJobs} منشور مؤكَّد فقط`,
    });
  }

  // 8) Winning trend types — learned from actioned trends + their ideas' progress
  const winning = await learnWinningTrends(tenantId);
  if (winning.hasSignal && winning.text) {
    recs.push({
      key: "winning_trends", category: "trend",
      confidence: winning.progressed ? "medium" : "low", ownerRole: "content",
      text: winning.text,
      basis: winning.basis.join(" · "),
    });
  }

  return recs;
}
