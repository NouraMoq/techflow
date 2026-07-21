import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { TREND_DECISION, FIT_LABEL, RISK_LABEL, TREND_TYPE_LABEL } from "@/lib/production";
import { dateAr } from "@/lib/commerce";
import { IconShield } from "@/components/icons";
import { getTopHashtags } from "@/lib/hashtags";
import HashtagCloud from "@/components/HashtagCloud";
import NewTrend from "./NewTrend";
import { setTrendDecision } from "./actions";

export default async function TrendsPage() {
  const s = await requireSession();
  const [trends, topTags] = await Promise.all([
    prisma.trend.findMany({
      where: { tenantId: s.tid, deletedAt: null }, orderBy: { growthScore: "desc" },
    }),
    getTopHashtags(s.tid, 20),
  ]);
  const mayManage = can(s.role, "trend.manage");

  return (
    <>
      <div className="page-head">
        <div><h1>رادار الترندات</h1><p>رصد يدوي وبيانات تجريبية — دون أي جمع غير مصرّح به للبيانات.</p></div>
        <div className="actions">{mayManage && <NewTrend />}</div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconShield />
        <div><b>التزام</b><p>لا Web Scraping مخالف لشروط المنصات. المصادر الرسمية تُضاف مستقبلًا عبر طبقة التكامل.</p></div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <b style={{ fontSize: 15 }}>أبرز الهاشتاقات المرتبطة بمحتواك</b>
          <span className="faint" style={{ fontSize: 12 }}>مشتقّة من ترنداتك وسيناريوهاتك وأفكارك · انقر للنسخ</span>
        </div>
        <HashtagCloud items={topTags} />
      </div>

      <div className="grid g-2">
        {trends.map((t) => {
          const dec = TREND_DECISION[t.decision] ?? TREND_DECISION.studying;
          return (
            <div className="card card-pad" key={t.id}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <b style={{ fontSize: 15 }}>{t.name}</b>
                <span className={`badge ${dec.cls}`}>{dec.label}</span>
              </div>
              <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>
                {t.type && <span className="badge b-slate">{TREND_TYPE_LABEL[t.type] ?? t.type}</span>}
                {t.sound && t.sound !== "—" && <span className="badge b-slate">{t.sound}</span>}
                {t.hashtag && <span className="badge b-primary" style={{ fontSize: 10 }}>{t.hashtag}</span>}
              </div>

              <div className="row between" style={{ fontSize: 12, marginBottom: 4 }}>
                <span className="faint">درجة النمو</span><b>{t.growthScore}%</b>
              </div>
              <div className="bar" style={{ marginBottom: 12 }}>
                <i style={{ width: `${t.growthScore}%`, background: t.growthScore > 80 ? "var(--green)" : "var(--amber)" }} />
              </div>

              <div className="grid g-2" style={{ gap: 8, fontSize: 12, marginBottom: 10 }}>
                <div><span className="faint">العمر المتوقع</span><br /><b>{t.expectedLife ?? "—"}</b></div>
                <div><span className="faint">الملاءمة</span><br /><b>{t.fit ? FIT_LABEL[t.fit] ?? t.fit : "—"}</b></div>
                <div><span className="faint">المخاطر</span><br /><b>{t.risk ? RISK_LABEL[t.risk] ?? t.risk : "—"}</b></div>
                <div><span className="faint">تنتهي</span><br /><b style={{ color: "var(--rose)" }}>{dateAr(t.expiresAt)}</b></div>
              </div>

              {t.angle && (
                <div className="callout info" style={{ padding: "8px 12px", marginBottom: 10 }}>
                  <IconShield /><div><b style={{ fontSize: 12.5 }}>زاوية مقترحة</b><p>{t.angle}</p></div>
                </div>
              )}

              {mayManage && (
                <div className="row wrap" style={{ gap: 6 }}>
                  {t.decision !== "use" && (
                    <form action={setTrendDecision}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="decision" value="use" />
                      <button className="btn btn-soft" style={{ fontSize: 12, padding: "5px 11px" }}>استخدام</button>
                    </form>
                  )}
                  {t.decision !== "ignore" && (
                    <form action={setTrendDecision}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="decision" value="ignore" />
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 11px" }}>تجاهل</button>
                    </form>
                  )}
                  {t.decision === "use" && (
                    <form action={setTrendDecision}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="decision" value="used" />
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 11px" }}>تحديد كمُستخدَم</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {trends.length === 0 && <div className="faint">لا ترندات مرصودة بعد.</div>}
      </div>
    </>
  );
}
