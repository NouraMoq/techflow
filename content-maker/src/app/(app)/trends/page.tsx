import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { TREND_DECISION, FIT_LABEL, RISK_LABEL } from "@/lib/production";
import { IconShield } from "@/components/icons";
import { getTopHashtags } from "@/lib/hashtags";
import HashtagCloud from "@/components/HashtagCloud";
import { learnWinningTrends } from "@/lib/trends/learning";
import { trendPerformanceRanking, trendContentForPerformance } from "@/lib/trends/performance";
import { TREND_STATUS_LABEL, SENTIMENT_LABEL, COMPETITION_LABEL, TREND_SOURCE_LABEL } from "@/lib/trends/labels";
import NewTrend from "./NewTrend";
import DiscoverPanel from "./DiscoverPanel";
import { setTrendDecision, detectOpportunitiesAction, convertOpportunityToIdea, recordPerformanceAction } from "./actions";

type Tab = "discover" | "analyze" | "create" | "performance";
type Trend = Awaited<ReturnType<typeof prisma.trend.findMany>>[number];
type Opp = Awaited<ReturnType<typeof prisma.trendOpportunity.findMany>>[number];
type PerfContent = Awaited<ReturnType<typeof trendContentForPerformance>>[number];
const IDEA_STATUS_AR: Record<string, string> = { scripting: "كتابة السيناريو", scheduled: "مجدولة", production: "قيد الإنتاج", published: "منشورة" };

const OPP_KIND: Record<string, { label: string; cls: string }> = {
  from_trend: { label: "من ترند", cls: "b-primary" },
  audience_gap: { label: "فجوة جمهور", cls: "b-amber" },
  low_competition: { label: "منافسة منخفضة", cls: "b-green" },
};

export default async function TrendsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const s = await requireSession();
  const tab: Tab = (["discover", "analyze", "create", "performance"].includes(searchParams.tab ?? "") ? searchParams.tab : "analyze") as Tab;
  const [trends, topTags, signalCount, opportunities, winning, perfRanking, perfContent] = await Promise.all([
    prisma.trend.findMany({ where: { tenantId: s.tid, deletedAt: null }, orderBy: [{ growthScore: "desc" }] }),
    getTopHashtags(s.tid, 20),
    prisma.trendSignal.count({ where: { tenantId: s.tid } }),
    prisma.trendOpportunity.findMany({ where: { tenantId: s.tid, deletedAt: null }, orderBy: [{ score: "desc" }] }),
    learnWinningTrends(s.tid),
    trendPerformanceRanking(s.tid),
    trendContentForPerformance(s.tid),
  ]);
  const mayPerf = can(s.role, "analytics.view");
  const mayManage = can(s.role, "trend.manage");
  const mayIdea = can(s.role, "idea.create");
  const openOpps = opportunities.filter((o) => o.status === "open");
  const convertedOpps = opportunities.filter((o) => o.status === "converted");

  const TabLink = ({ id, label }: { id: Tab; label: string }) => (
    <Link href={`/trends?tab=${id}`} className={`btn ${tab === id ? "primary" : "btn-ghost"}`} style={{ fontSize: 13 }}>{label}</Link>
  );

  return (
    <>
      <div className="page-head">
        <div><h1>رادار الترندات</h1><p>محرك ذكاء ترندات: اكتشف الموضوعات الرائجة، حلّلها، وحوّلها إلى محتوى — دون أي جمع غير مصرّح به.</p></div>
        {mayManage && tab === "analyze" && <div className="actions"><NewTrend /></div>}
      </div>

      <div className="row wrap" style={{ gap: 8, marginBottom: 16 }}>
        <TabLink id="discover" label="① اكتشف" />
        <TabLink id="analyze" label="② حلّل" />
        <TabLink id="create" label="③ اصنع محتوى" />
        <TabLink id="performance" label="④ الأداء" />
      </div>

      {tab === "discover" && (
        <>
          <div className="callout info" style={{ marginBottom: 16 }}>
            <IconShield />
            <div><b>التزام</b><p>لا Web Scraping ولا تجاوز لحماية المنصات. المصادر الرسمية تُضاف لاحقًا عبر طبقة المزوّدات دون تغيير النظام.</p></div>
          </div>
          {mayManage
            ? <DiscoverPanel />
            : <div className="faint">تحتاج صلاحية «إدارة الترندات» للاستيراد.</div>}
          <p className="faint" style={{ fontSize: 12.5, marginTop: 12 }}>إجمالي الإشارات المُستوردة: <b>{signalCount}</b></p>
        </>
      )}

      {tab === "analyze" && (
        <>
          {winning.hasSignal && (
            <div className="card card-pad" style={{ marginBottom: 16, borderInlineStart: "3px solid var(--primary)" }}>
              <div className="row between" style={{ marginBottom: 6 }}>
                <b style={{ fontSize: 15 }}>ما ينجح معك</b>
                <span className="badge b-primary">تعلّم من أدائك</span>
              </div>
              <p style={{ fontSize: 13.5, marginBottom: 6 }}>{winning.text}</p>
              <p className="faint" style={{ fontSize: 12 }}>{winning.basis.join(" · ")}</p>
            </div>
          )}
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <b style={{ fontSize: 15 }}>أبرز الهاشتاقات المرتبطة بمحتواك</b>
              <span className="faint" style={{ fontSize: 12 }}>مشتقّة من ترنداتك وسيناريوهاتك وأفكارك · انقر للنسخ</span>
            </div>
            <HashtagCloud items={topTags} />
          </div>
          <div className="grid g-2">
            {trends.map((t) => <TrendCard key={t.id} t={t} mayManage={mayManage} />)}
            {trends.length === 0 && <div className="faint">لا ترندات بعد — ابدأ من تبويب «اكتشف».</div>}
          </div>
        </>
      )}

      {tab === "create" && (
        <>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="row between" style={{ alignItems: "flex-start", gap: 12 }}>
              <div>
                <b style={{ fontSize: 15 }}>فرص صناعة المحتوى</b>
                <p className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>مشتقّة من الترندات الملائمة ومن <b>فجوات أسئلة جمهورك</b> (طلب متزايد + منافسة منخفضة) — حتى قبل تشكّل الترند.</p>
              </div>
              {mayManage && (
                <form action={detectOpportunitiesAction}><button className="btn primary" style={{ fontSize: 13, whiteSpace: "nowrap" }}>اكتشف الفرص</button></form>
              )}
            </div>
          </div>
          <div className="grid g-2">
            {openOpps.map((o) => <OppCard key={o.id} o={o} mayIdea={mayIdea} />)}
            {convertedOpps.map((o) => (
              <div className="card card-pad" key={o.id} style={{ opacity: 0.7 }}>
                <div className="row between"><b style={{ fontSize: 14 }}>{o.title}</b><span className="badge b-green">حُوّلت لفكرة ✓</span></div>
              </div>
            ))}
            {opportunities.length === 0 && <div className="faint">لا فرص بعد — اضغط «اكتشف الفرص» بعد تحليل ترندات أو إضافة أسئلة جمهور.</div>}
          </div>
        </>
      )}

      {tab === "performance" && (
        <>
          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <b style={{ fontSize: 15 }}>أفضل الترندات أداءً</b>
            <p className="faint" style={{ fontSize: 12.5, margin: "4px 0 10px" }}>مرتّبة حسب متوسط التفاعل الفعلي للمحتوى المنشور المشتق منها — هذه الحلقة تُغذّي «ما ينجح معك» والتوصيات.</p>
            {perfRanking.length ? (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>الترند</th><th>محتوى</th><th>مشاهدات</th><th>متوسط التفاعل</th></tr></thead>
                  <tbody>
                    {perfRanking.map((r, i) => (
                      <tr key={r.trendId}>
                        <td><Link href={`/trends/${r.trendId}`}><b>{i + 1}. {r.name}</b></Link>{r.sentiment && <span className="badge b-slate" style={{ fontSize: 10, marginInlineStart: 6 }}>{SENTIMENT_LABEL[r.sentiment] ?? r.sentiment}</span>}</td>
                        <td>{r.contentCount}</td>
                        <td>{r.totalViews.toLocaleString("en")}</td>
                        <td><b>{r.avgEngagementPct}٪</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="faint" style={{ fontSize: 13 }}>لا بيانات أداء بعد — سجّل أداء محتوى منشور أدناه لتظهر هنا.</p>}
          </div>

          <div className="card card-pad">
            <b style={{ fontSize: 15 }}>سجّل أداء محتواك المشتق من الترندات</b>
            <p className="faint" style={{ fontSize: 12.5, margin: "4px 0 6px" }}>أدخل الأرقام يدويًا — لا جمع تلقائي غير مصرّح به. (الاستيراد الرسمي عبر واجهة المنصة لاحقًا.)</p>
            {perfContent.length
              ? perfContent.map((c) => <PerfRow key={c.id} c={c} mayPerf={mayPerf} />)
              : <p className="faint" style={{ fontSize: 13 }}>لا محتوى مشتق من الترندات وصل لمرحلة الإنتاج/النشر بعد.</p>}
          </div>
        </>
      )}
    </>
  );
}

function PerfRow({ c, mayPerf }: { c: PerfContent; mayPerf: boolean }) {
  return (
    <div style={{ borderTop: "1px solid var(--border,#eee)", padding: "10px 0" }}>
      <div className="row between" style={{ marginBottom: 6, gap: 8 }}>
        <b style={{ fontSize: 13.5 }}>{c.title}</b>
        <span className="badge b-slate" style={{ fontSize: 10, whiteSpace: "nowrap" }}>{IDEA_STATUS_AR[c.status] ?? c.status} · {c._count.performances} قياس</span>
      </div>
      {mayPerf ? (
        <form action={recordPerformanceAction} className="row wrap" style={{ gap: 6, alignItems: "center" }}>
          <input type="hidden" name="ideaId" value={c.id} />
          <input name="views" inputMode="numeric" placeholder="مشاهدات" style={{ width: 92, fontSize: 12 }} />
          <input name="likes" inputMode="numeric" placeholder="إعجابات" style={{ width: 82, fontSize: 12 }} />
          <input name="shares" inputMode="numeric" placeholder="مشاركات" style={{ width: 82, fontSize: 12 }} />
          <input name="comments" inputMode="numeric" placeholder="تعليقات" style={{ width: 82, fontSize: 12 }} />
          <input name="saves" inputMode="numeric" placeholder="حفظ" style={{ width: 66, fontSize: 12 }} />
          <button className="btn btn-soft" style={{ fontSize: 12, padding: "5px 12px" }}>سجّل</button>
        </form>
      ) : <span className="faint" style={{ fontSize: 12 }}>تحتاج صلاحية التحليلات.</span>}
    </div>
  );
}

// Analyzed trend card (links to the detail page; keeps decision actions).
function TrendCard({ t, mayManage }: { t: Trend; mayManage: boolean }) {
  const dec = TREND_DECISION[t.decision] ?? TREND_DECISION.studying;
  const st = TREND_STATUS_LABEL[t.status] ?? TREND_STATUS_LABEL.new;
  return (
    <div className="card card-pad">
      <div className="row between" style={{ marginBottom: 8 }}>
        <Link href={`/trends/${t.id}`} style={{ fontSize: 15, fontWeight: 800 }}>{t.name}</Link>
        <span className={`badge ${st.cls}`}>{st.label}</span>
      </div>
      {t.summary && <p className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>{t.summary}</p>}
      <div className="row wrap" style={{ gap: 6, marginBottom: 10 }}>
        {t.source && <span className="badge b-slate" style={{ fontSize: 10 }}>{TREND_SOURCE_LABEL[t.source as keyof typeof TREND_SOURCE_LABEL] ?? t.source}</span>}
        {t.sentiment && <span className="badge b-slate">{SENTIMENT_LABEL[t.sentiment] ?? t.sentiment}</span>}
        {t.competition && <span className="badge b-slate">منافسة {COMPETITION_LABEL[t.competition] ?? t.competition}</span>}
        {t.hashtag && <span className="badge b-primary" style={{ fontSize: 10 }}>{t.hashtag}</span>}
      </div>
      <div className="grid g-2" style={{ gap: 10, marginBottom: 10 }}>
        <ScoreBar label="درجة النمو" value={t.growthScore} />
        <ScoreBar label="ملاءمة العميل" value={t.clientScore ?? 0} accent />
      </div>
      <div className="row wrap" style={{ gap: 8, fontSize: 12, marginBottom: 10 }}>
        <span className="faint">الملاءمة: <b>{t.fit ? FIT_LABEL[t.fit] ?? t.fit : "—"}</b></span>
        <span className="faint">المخاطر: <b style={{ color: t.risk === "high" ? "var(--rose)" : undefined }}>{t.risk ? RISK_LABEL[t.risk] ?? t.risk : "—"}</b></span>
        <span className="faint">الثقة: <b>{t.confidenceScore ?? "—"}%</b></span>
      </div>
      <div className="row wrap" style={{ gap: 6 }}>
        <Link href={`/trends/${t.id}`} className="btn btn-soft" style={{ fontSize: 12, padding: "5px 11px" }}>التفاصيل والتحليل</Link>
        {mayManage && t.decision !== "use" && (
          <form action={setTrendDecision}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="decision" value="use" />
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 11px" }}>استخدام</button></form>
        )}
        {mayManage && t.decision !== "ignore" && (
          <form action={setTrendDecision}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="decision" value="ignore" />
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 11px" }}>تجاهل</button></form>
        )}
      </div>
    </div>
  );
}

// Opportunity card (level 3): convert to idea. May link back to a Trend or stand alone.
function OppCard({ o, mayIdea }: { o: Opp; mayIdea: boolean }) {
  const k = OPP_KIND[o.kind] ?? OPP_KIND.from_trend;
  return (
    <div className="card card-pad">
      <div className="row between" style={{ marginBottom: 8, gap: 8 }}>
        {o.trendId
          ? <Link href={`/trends/${o.trendId}`} style={{ fontSize: 14.5, fontWeight: 800 }}>{o.title}</Link>
          : <b style={{ fontSize: 14.5 }}>{o.title}</b>}
        <span className={`badge ${k.cls}`} style={{ whiteSpace: "nowrap" }}>{k.label}</span>
      </div>
      {o.reason && <p className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>{o.reason}</p>}
      <div className="row wrap" style={{ gap: 8, fontSize: 12, marginBottom: 10 }}>
        <span className="badge b-slate">أولوية {o.score}%</span>
        {o.confidence != null && <span className="badge b-slate">ثقة {o.confidence}%</span>}
      </div>
      {mayIdea ? (
        <form action={convertOpportunityToIdea}>
          <input type="hidden" name="id" value={o.id} />
          <button className="btn primary" style={{ fontSize: 13 }}>حوّل إلى فكرة ←</button>
        </form>
      ) : <span className="faint" style={{ fontSize: 12 }}>تحتاج صلاحية إنشاء الأفكار.</span>}
    </div>
  );
}

function ScoreBar({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div className="row between" style={{ fontSize: 12, marginBottom: 4 }}><span className="faint">{label}</span><b>{value}%</b></div>
      <div className="bar"><i style={{ width: `${value}%`, background: accent ? "var(--primary)" : value > 80 ? "var(--green)" : "var(--amber)" }} /></div>
    </div>
  );
}
