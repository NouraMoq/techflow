import Link from "next/link";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { REPORT_TYPES } from "@/lib/reports";
import { IconDoc, IconChart } from "@/components/icons";

export default async function ReportsPage() {
  const s = await requireSession();
  const mayExport = can(s.role, "report.export");

  return (
    <>
      <div className="page-head">
        <div><h1>التقارير</h1><p>عرض جاهز للطباعة (طباعة ← حفظ PDF) وتصدير CSV — البيانات فعلية ومعزولة حسب الحساب.</p></div>
      </div>

      {!mayExport && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <IconDoc /><div><b>عرض فقط</b><p>ليست لديك صلاحية تصدير التقارير.</p></div>
        </div>
      )}

      <div className="grid g-2">
        {REPORT_TYPES.map((r) => (
          <div className="card card-pad" key={r.key}>
            <div className="row" style={{ gap: 10, marginBottom: 8 }}>
              <span className="st-ico"><IconChart /></span>
              <b style={{ fontSize: 15 }}>{r.title}</b>
            </div>
            <p className="muted" style={{ fontSize: 12.5, minHeight: 34 }}>{r.desc}</p>
            <div className="row" style={{ gap: 8 }}>
              <Link href={`/reports/${r.key}`} className="btn btn-soft" style={{ fontSize: 12.5, padding: "6px 12px" }}>
                <IconDoc /> عرض / طباعة
              </Link>
              {mayExport && (
                <a href={`/api/reports/${r.key}`} className="btn btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px" }} download>
                  تصدير CSV
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
