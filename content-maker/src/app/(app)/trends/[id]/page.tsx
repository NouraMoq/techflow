import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseArr } from "@/lib/json";
import { FIT_LABEL, RISK_LABEL } from "@/lib/production";
import { SENTIMENT_LABEL, COMPETITION_LABEL, TREND_SOURCE_LABEL } from "@/lib/trends/labels";
import { IconShield } from "@/components/icons";
import { keywords as extractKw } from "@/lib/trends/analysis/text";
import { convertTrendToIdea } from "../actions";

export default async function TrendDetailPage({ params }: { params: { id: string } }) {
  const s = await requireSession();
  const t = await prisma.trend.findFirst({ where: { id: params.id, tenantId: s.tid, deletedAt: null } });
  if (!t) notFound();

  const kw = parseArr(t.keywordsJson);
  const [signals, questions] = await Promise.all([
    prisma.trendSignal.findMany({ where: { clusterTrendId: t.id, tenantId: s.tid }, orderBy: { createdAt: "asc" } }),
    prisma.audienceQuestion.findMany({ where: { tenantId: s.tid, deletedAt: null }, select: { id: true, text: true } }),
  ]);
  const kwSet = new Set(kw);
  const relatedQs = questions.filter((q) => extractKw(q.text, [], 6).some((k) => kwSet.has(k))).slice(0, 5);
  const mayIdea = can(s.role, "idea.create");
  const highRisk = t.risk === "high";

  const Section = ({ title, items }: { title: string; items: string[] }) =>
    items.length ? (
      <div style={{ marginBottom: 14 }}>
        <b style={{ fontSize: 13.5 }}>{title}</b>
        <ul style={{ paddingInlineStart: 18, margin: "6px 0 0", lineHeight: 1.7, fontSize: 13.5 }}>
          {items.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <Link href="/trends?tab=analyze" className="faint" style={{ fontSize: 12.5 }}>← رادار الترندات</Link>
          <h1 style={{ marginTop: 4 }}>{t.name}</h1>
          {t.summary && <p>{t.summary}</p>}
        </div>
      </div>

      <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
        {t.source && <span className="badge b-slate">{TREND_SOURCE_LABEL[t.source as keyof typeof TREND_SOURCE_LABEL] ?? t.source}</span>}
        {t.sentiment && <span className="badge b-slate">النبرة: {SENTIMENT_LABEL[t.sentiment] ?? t.sentiment}</span>}
        {t.competition && <span className="badge b-slate">منافسة {COMPETITION_LABEL[t.competition] ?? t.competition}</span>}
        <span className="badge b-slate">{t.signalCount} إشارة</span>
        {t.hashtag && <span className="badge b-primary">{t.hashtag}</span>}
      </div>

      <div className="grid g-2" style={{ marginBottom: 16 }}>
        <div className="card card-pad">
          <Bar label="قوة الترند (Trend Score)" value={t.growthScore} />
          <div style={{ height: 10 }} />
          <Bar label="ملاءمة العميل" value={t.clientScore ?? 0} accent />
          <div style={{ height: 10 }} />
          <Bar label="درجة الثقة (Confidence)" value={t.confidenceScore ?? 0} />
          <div className="row wrap" style={{ gap: 8, marginTop: 12, fontSize: 12.5 }}>
            <span className="faint">الملاءمة: <b>{t.fit ? FIT_LABEL[t.fit] ?? t.fit : "—"}</b></span>
            <span className="faint">المخاطر: <b style={{ color: highRisk ? "var(--rose)" : undefined }}>{t.risk ? RISK_LABEL[t.risk] ?? t.risk : "—"}</b></span>
          </div>
        </div>
        <div className="card card-pad">
          <b style={{ fontSize: 13.5 }}>أساس درجة الملاءمة</b>
          <ul style={{ paddingInlineStart: 18, margin: "6px 0 0", lineHeight: 1.7, fontSize: 13 }}>
            {parseArr(t.scoreBasisJson).map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        {t.story && <p style={{ fontSize: 14, marginBottom: 8 }}><b>القصة:</b> {t.story}</p>}
        {t.whyTrending && <p style={{ fontSize: 14, marginBottom: 12 }}><b>لماذا ينتشر:</b> {t.whyTrending}</p>}
        {kw.length > 0 && (
          <div className="row wrap" style={{ gap: 6, marginBottom: 4 }}>
            {kw.map((k) => <span key={k} className="badge b-slate" style={{ fontSize: 11 }} dir="auto">#{k}</span>)}
          </div>
        )}
      </div>

      <div className="grid g-2">
        <div className="card card-pad">
          <Section title="المحاور الفرعية" items={parseArr(t.subtopicsJson)} />
          <Section title="أسئلة متكررة" items={parseArr(t.questionsJson)} />
          {relatedQs.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <b style={{ fontSize: 13.5 }}>أسئلة جمهورك المرتبطة</b>
              <ul style={{ paddingInlineStart: 18, margin: "6px 0 0", lineHeight: 1.7, fontSize: 13.5 }}>
                {relatedQs.map((q) => <li key={q.id}>{q.text}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="card card-pad">
          <Section title="خطافات مقترحة" items={parseArr(t.hooksJson)} />
          <Section title="فرص صناعة المحتوى" items={parseArr(t.opportunitiesJson)} />
          <Section title="مخاطر" items={parseArr(t.risksJson)} />
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        <b style={{ fontSize: 13.5 }}>الإشارات المُكوّنة لهذا الموضوع ({signals.length})</b>
        <ul style={{ paddingInlineStart: 18, margin: "6px 0 0", lineHeight: 1.7, fontSize: 12.5 }}>
          {signals.map((sig) => <li key={sig.id} className="faint">{sig.text}</li>)}
        </ul>
      </div>

      <div className="card card-pad" style={{ marginTop: 16 }}>
        {highRisk ? (
          <div className="callout" style={{ background: "var(--rose-tint,#fee2e2)", padding: "10px 14px" }}>
            <IconShield />
            <div><b>ترند عالي الخطورة</b><p>لا يُنصح بتحويله إلى محتوى مباشرة — راجع <Link href="/crisis">السمعة والأزمات</Link> والامتثال أولًا.</p></div>
          </div>
        ) : t.status === "actioned" ? (
          <span className="badge b-green">تم تحويله إلى فكرة ✓ — راجع <Link href="/ideas">بنك الأفكار</Link></span>
        ) : mayIdea ? (
          <form action={convertTrendToIdea}>
            <input type="hidden" name="id" value={t.id} />
            <button className="btn primary" style={{ fontSize: 14 }}>حوّل إلى فكرة في بنك الأفكار ←</button>
          </form>
        ) : <span className="faint">تحتاج صلاحية إنشاء الأفكار للتحويل.</span>}
      </div>
    </>
  );
}

function Bar({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div className="row between" style={{ fontSize: 12.5, marginBottom: 4 }}><span className="faint">{label}</span><b>{value}%</b></div>
      <div className="bar"><i style={{ width: `${value}%`, background: accent ? "var(--primary)" : value > 80 ? "var(--green)" : "var(--amber)" }} /></div>
    </div>
  );
}
