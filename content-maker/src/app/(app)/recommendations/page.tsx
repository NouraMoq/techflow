import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can, ROLE_LABELS, type RoleKey } from "@/lib/rbac";
import { CONFIDENCE, REC_STATUS } from "@/lib/community";
import { IconSparkles } from "@/components/icons";
import { regenerate, applyRecommendation, dismissRecommendation } from "./actions";

export default async function RecommendationsPage() {
  const s = await requireSession();
  const recs = await prisma.recommendation.findMany({
    where: { tenantId: s.tid }, orderBy: [{ status: "asc" }, { confidence: "asc" }, { createdAt: "desc" }],
  });
  const mayManage = can(s.role, "recommendation.manage");
  const open = recs.filter((r) => r.status === "open");

  return (
    <>
      <div className="page-head">
        <div><h1>التوصيات الذكية</h1><p>الأرقام تتحوّل إلى إجراءات — كل توصية مُشتقّة من بيانات حسابك فعليًا، مع الأساس ومستوى الثقة.</p></div>
        <div className="actions">
          {mayManage && (
            <form action={regenerate}>
              <button className="btn btn-primary"><IconSparkles /> توليد التوصيات</button>
            </form>
          )}
        </div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconSparkles /><div><b>كيف تُولَّد؟</b><p>محرّك قواعد يفحص بياناتك (توازن الأعمدة، ترندات توشك الانتهاء، فواتير متأخرة، التزامات قريبة، أفكار بلا سيناريو…) ويسجّل الأساس لكل توصية. لا اختلاق أرقام.</p></div>
      </div>

      {recs.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center" }}>
          <div className="faint" style={{ marginBottom: 12 }}>لا توصيات بعد — اضغط «توليد التوصيات» لتحليل بياناتك.</div>
        </div>
      ) : (
        <>
          <div className="row faint" style={{ fontSize: 12.5, marginBottom: 12 }}>{open.length} توصية مفتوحة من {recs.length}</div>
          <div className="grid g-2">
            {recs.map((r) => {
              const conf = CONFIDENCE[r.confidence] ?? CONFIDENCE.medium;
              const st = REC_STATUS[r.status] ?? REC_STATUS.open;
              const owner = r.ownerRole ? ROLE_LABELS[r.ownerRole as RoleKey] ?? r.ownerRole : "—";
              return (
                <div className="card card-pad" key={r.id} style={r.status !== "open" ? { opacity: 0.7 } : undefined}>
                  <div className="row between" style={{ marginBottom: 10 }}>
                    <span className="st-ico"><IconSparkles /></span>
                    <div className="row" style={{ gap: 6 }}>
                      <span className={`badge ${conf.cls}`}>{conf.label}</span>
                      {r.status !== "open" && <span className={`badge ${st.cls}`}>{st.label}</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{r.text}</p>
                  <div className="divider" />
                  <div className="row between faint" style={{ fontSize: 12 }}>
                    <span>الأساس: {r.basis ?? "—"}</span>
                    <span>المسؤول: {owner}</span>
                  </div>
                  {r.result && <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>النتيجة: {r.result}</div>}
                  {mayManage && r.status === "open" && (
                    <div className="row" style={{ gap: 8, marginTop: 12 }}>
                      <form action={applyRecommendation}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "6px 12px" }}>تطبيق (إنشاء مهمة)</button>
                      </form>
                      <form action={dismissRecommendation}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px" }}>تأجيل</button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
