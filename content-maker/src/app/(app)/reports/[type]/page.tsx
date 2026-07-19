import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getReport, isReportType } from "@/lib/reports";
import PrintButton from "./PrintButton";
import { IconDoc } from "@/components/icons";

export default async function ReportView({ params }: { params: { type: string } }) {
  const s = await requireSession();
  if (!isReportType(params.type)) notFound();
  const report = await getReport(s.tid, params.type);
  const generatedAt = new Date().toLocaleDateString("ar-SA");
  const mayExport = can(s.role, "report.export");

  return (
    <div className="report-page">
      {/* Toolbar (hidden when printing) */}
      <div className="no-print row between wrap" style={{ marginBottom: 18, gap: 10 }}>
        <Link href="/reports" className="faint" style={{ fontSize: 13, fontWeight: 700 }}>← التقارير</Link>
        <div className="row" style={{ gap: 8 }}>
          {mayExport && <a href={`/api/reports/${report.key}`} className="btn btn-ghost" download>تصدير CSV</a>}
          <PrintButton />
        </div>
      </div>

      {/* Printable document */}
      <div className="report-doc">
        <div className="report-head">
          <div className="row" style={{ gap: 10 }}>
            <div className="brand-logo" style={{ width: 34, height: 34, fontSize: 16 }}>ص</div>
            <div>
              <b style={{ fontSize: 15, fontWeight: 800 }}>صانع المحتوى · نوفاميتريكس</b>
              <div className="faint" style={{ fontSize: 11.5 }}>من الفكرة إلى التأثير</div>
            </div>
          </div>
          <div style={{ textAlign: "start" }}>
            <div className="faint" style={{ fontSize: 11.5 }}>تاريخ التوليد</div>
            <b style={{ fontSize: 13 }}>{generatedAt}</b>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "18px 0 2px" }}>{report.title}</h1>
        {report.subtitle && <p className="muted" style={{ fontSize: 13, margin: 0 }}>{report.subtitle}</p>}

        {report.kpis && report.kpis.length > 0 && (
          <div className="report-kpis">
            {report.kpis.map((k) => (
              <div className="report-kpi" key={k.label}>
                <b>{k.value}</b><span>{k.label}</span>
              </div>
            ))}
          </div>
        )}

        {report.tables.map((t, i) => (
          <div key={i} style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 8 }}>{t.heading}</h3>
            <div className="tbl-wrap">
              <table className="tbl report-tbl">
                <thead><tr>{t.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {t.rows.map((r, ri) => <tr key={ri}>{r.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>)}
                  {t.rows.length === 0 && <tr><td colSpan={t.columns.length} className="faint" style={{ textAlign: "center", padding: 16 }}>لا بيانات</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {report.note && (
          <div className="report-note"><IconDoc /> <span>{report.note}</span></div>
        )}

        <div className="report-foot faint">
          صانع المحتوى — نوفاميتريكس · تقرير مُولّد آليًا من بيانات الحساب · الأسعار لا تشمل ضريبة القيمة المضافة عند انطباقها.
        </div>
      </div>
    </div>
  );
}
