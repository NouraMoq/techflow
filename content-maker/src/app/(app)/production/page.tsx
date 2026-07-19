import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { WORKFLOW_STAGES } from "@/lib/constants";

export default async function ProductionPage() {
  const s = await requireSession();
  const projects = await prisma.contentProject.findMany({
    where: { tenantId: s.tid, deletedAt: null }, orderBy: { dueDate: "asc" },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>المحتوى والإنتاج</h1>
          <p>خط الإنتاج (Workflow) — {WORKFLOW_STAGES.length} مرحلة قابلة للتخصيص لكل عميل.</p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row wrap" style={{ gap: 6 }}>
          {WORKFLOW_STAGES.map((st, i) => (
            <span className={`badge ${i < 5 ? "b-green" : i < 8 ? "b-amber" : "b-slate"}`} style={{ fontSize: 10.5 }} key={i}>{i + 1}. {st}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>المشروع</th><th>المرحلة الحالية</th><th>المسؤول</th><th>الاستحقاق</th><th>التقدم</th></tr></thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.title}</b></td>
                  <td><span className="badge b-primary">{p.stageIndex + 1}. {WORKFLOW_STAGES[p.stageIndex]}</span></td>
                  <td>{p.ownerName ?? "—"}</td>
                  <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString("ar-SA") : "—"}</td>
                  <td style={{ minWidth: 120 }}>
                    <div className="bar"><i style={{ width: `${Math.round((p.stageIndex / (WORKFLOW_STAGES.length - 1)) * 100)}%` }} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
