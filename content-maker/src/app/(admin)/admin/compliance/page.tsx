import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { IconShield } from "@/components/icons";
import { toggleComplianceItem } from "./actions";

export default async function AdminCompliance() {
  await requireAdmin();
  const [items, playbooks, reviewCount] = await Promise.all([
    prisma.complianceItem.findMany({ orderBy: { order: "asc" } }),
    prisma.responsePlaybook.findMany({ orderBy: { key: "asc" } }),
    prisma.complianceReview.count(),
  ]);

  return (
    <>
      <div className="page-head">
        <div><h1>إعدادات الامتثال</h1><p>بنود قائمة التحقق وأدلة الاستجابة — قابلة للتفعيل/التعطيل مع تغيّر الأنظمة.</p></div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconShield />
        <div><b>تنبيه</b><p>هذه إعدادات تشغيلية. المتطلبات النظامية تحتاج «تحققًا نظاميًا محدثًا» ومراجعة مختص مرخّص. عدد المراجعات المُنفّذة عبر الحسابات: {reviewCount}.</p></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>بنود قائمة التحقق</h3><span className="sub">{items.filter((i) => i.active).length}/{items.length} فعّال</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>البند</th><th>الفئة</th><th>الحالة</th><th>الإجراء</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td><b>{it.question}</b></td>
                  <td><span className="badge b-slate">{it.category ?? "عام"}</span></td>
                  <td><span className={`badge ${it.active ? "b-green" : "b-slate"}`}>{it.active ? "فعّال" : "معطّل"}</span></td>
                  <td>
                    <form action={toggleComplianceItem}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="active" value={it.active ? "false" : "true"} />
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 11px" }}>{it.active ? "تعطيل" : "تفعيل"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>أدلة الاستجابة (Playbooks)</h3><span className="sub">{playbooks.length} دليلًا</span></div>
        <div className="card-pad">
          <div className="grid g-2">
            {playbooks.map((p) => (
              <div key={p.id} className="row between" style={{ padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 10 }}>
                <b style={{ fontSize: 13 }}>{p.title}</b>
                <span className={`badge ${p.active ? "b-green" : "b-slate"}`}>{p.active ? "فعّال" : "معطّل"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
