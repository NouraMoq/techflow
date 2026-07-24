import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { TREND_DECISION, FIT_LABEL, RISK_LABEL } from "@/lib/production";
import { IconShield } from "@/components/icons";
import { getTopHashtags } from "@/lib/hashtags";
import HashtagCloud from "@/components/HashtagCloud";
import { TREND_STATUS_LABEL, SENTIMENT_LABEL, COMPETITION_LABEL, TREND_SOURCE_LABEL } from "@/lib/trends/labels";
import NewTrend from "./NewTrend";
import DiscoverPanel from "./DiscoverPanel";
import { setTrendDecision, convertTrendToIdea } from "./actions";

type Tab = "discover" | "analyze" | "create";
type Trend = Awaited<ReturnType<typeof prisma.trend.findMany>>[number];

export default async function TrendsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const s = await requireSession();
  const tab: Tab = (["discover", "analyze", "create"].includes(searchParams.tab ?? "") ? searchParams.tab : "analyze") as Tab;
  const [trends, topTags, signalCount] = await Promise.all([
    prisma.trend.findMany({ where: { tenantId: s.tid, deletedAt: null }, orderBy: [{ growthScore: "desc" }] }),
    getTopHashtags(s.tid, 20),
    prisma.trendSignal.count({ where: { tenantId: s.tid } }),
  ]);
  const mayManage = can(s.role, "trend.manage");
  const mayIdea = can(s.role, "idea.create");
  const candidates = trends.filter((t) => t.status !== "actioned");
  const actioned = trends.filter((t) => t.status === "actioned");

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
        <div className="grid g-2">
          {candidates.map((t) => <CreateCard key={t.id} t={t} mayIdea={mayIdea} />)}
          {actioned.map((t) => (
            <div className="card card-pad" key={t.id} style={{ opacity: 0.75 }}>
              <div className="row between"><b style={{ fontSize: 14 }}>{t.name}</b><span className="badge b-green">حُوّل لفكرة ✓</span></div>
            </div>
          ))}
          {trends.length === 0 && <div className="faint">لا ترندات جاهزة — استورد وحلّل أولًا.</div>}
        </div>
      )}
    </>
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
      <div className="row wrap" style={{ gap: 6, fontSize: 12, marginBottom: 10 }}>
        <span className="faint">الملاءمة: <b>{t.fit ? FIT_LABEL[t.fit] ?? t.fit : "—"}</b></span>
        <span className="faint">المخاطر: <b style={{ color: t.risk === "high" ? "var(--rose)" : undefined }}>{t.risk ? RISK_LABEL[t.risk] ?? t.risk : "—"}</b></span>
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

// "اصنع محتوى" card: convert to idea, or block + alert if high-risk.
function CreateCard({ t, mayIdea }: { t: Trend; mayIdea: boolean }) {
  const highRisk = t.risk === "high";
  return (
    <div className="card card-pad">
      <div className="row between" style={{ marginBottom: 8 }}>
        <Link href={`/trends/${t.id}`} style={{ fontSize: 15, fontWeight: 800 }}>{t.name}</Link>
        <span className="badge b-primary">ملاءمة {t.clientScore ?? 0}%</span>
      </div>
      {t.angle && <p className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>زاوية مقترحة: {t.angle}</p>}
      {highRisk ? (
        <div className="callout" style={{ background: "var(--rose-tint,#fee2e2)", padding: "8px 12px" }}>
          <IconShield />
          <div><b style={{ fontSize: 12.5 }}>ترند عالي الخطورة</b>
            <p>لا يُنصح بالتحويل المباشر — راجع <Link href="/crisis">السمعة والأزمات</Link> أولًا.</p></div>
        </div>
      ) : mayIdea ? (
        <form action={convertTrendToIdea}>
          <input type="hidden" name="id" value={t.id} />
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
