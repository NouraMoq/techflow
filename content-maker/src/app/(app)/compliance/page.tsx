import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseObj } from "@/lib/json";
import { COMPLIANCE_STATUS } from "@/lib/safety";
import { IconShield } from "@/components/icons";
import NewReview from "./NewReview";

type Answer = { question: string; answer: string; ok: boolean };

export default async function CompliancePage() {
  const s = await requireSession();
  const [items, reviews] = await Promise.all([
    prisma.complianceItem.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.complianceReview.findMany({ where: { tenantId: s.tid, deletedAt: null }, orderBy: { createdAt: "desc" } }),
  ]);
  const mayReview = can(s.role, "compliance.review");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>الامتثال</h1>
          <p>قائمة تحقق للمحتوى التجاري في السعودية — قابلة للتحديث من لوحة نوفاميتريكس.</p>
        </div>
        <div className="actions">{mayReview && <NewReview items={items.map((i) => ({ id: i.id, question: i.question }))} />}</div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconShield />
        <div><b>تنبيه نظامي</b><p>الأنظمة والسياسات قد تتغير — التفاصيل تحتاج «تحققًا نظاميًا محدثًا» ومراجعة مختص. لا يُدّعى امتثال نهائي تلقائيًا.</p></div>
      </div>

      <div className="grid g-12">
        <div className="card">
          <div className="card-head"><h3>سجل المراجعات</h3><span className="sub">{reviews.length} مراجعة</span></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>المحتوى</th><th>الحالة</th><th>المراجع</th><th>البنود المطابقة</th></tr></thead>
              <tbody>
                {reviews.map((r) => {
                  const answers = parseObj<Answer[]>(r.answersJson, []);
                  const ok = answers.filter((a) => a.ok).length;
                  const st = COMPLIANCE_STATUS[r.status] ?? COMPLIANCE_STATUS.pending;
                  return (
                    <tr key={r.id}>
                      <td><b>{r.subject}</b>{r.notes && <div className="faint" style={{ fontSize: 11.5 }}>{r.notes}</div>}</td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>{r.reviewedBy ?? "—"}</td>
                      <td><span className="faint">{ok}/{answers.length}</span></td>
                    </tr>
                  );
                })}
                {reviews.length === 0 && <tr><td colSpan={4} className="faint" style={{ textAlign: "center", padding: 20 }}>لا مراجعات بعد</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>بنود القائمة الفعّالة</h3><span className="sub">{items.length} بندًا</span></div>
          <div className="card-pad" style={{ paddingTop: 6 }}>
            {items.map((it) => (
              <div className="row" key={it.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 8 }}>
                <span className="badge b-slate" style={{ fontSize: 10 }}>{it.category ?? "عام"}</span>
                <span style={{ fontSize: 12.5 }}>{it.question}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
