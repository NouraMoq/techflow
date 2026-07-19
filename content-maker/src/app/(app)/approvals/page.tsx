import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { decideApproval } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار الموافقة", changes_requested: "طلب تعديل", conditional: "اعتماد مشروط",
  approved: "معتمد", rejected: "مرفوض",
};
const TYPE_LABEL: Record<string, string> = {
  content_review: "مراجعة محتوى", script_review: "مراجعة سيناريو", edit_review: "مراجعة مونتاج", final: "اعتماد نهائي",
};

export default async function ApprovalsPage() {
  const s = await requireSession();
  const approvals = await prisma.approval.findMany({ where: { tenantId: s.tid }, orderBy: { createdAt: "desc" } });
  const mayApprove = can(s.role, "content.approve");

  return (
    <>
      <div className="page-head">
        <div><h1>الموافقات</h1><p>مراجعة واعتماد المحتوى — سجل موثّق يمنع نشر نسخة غير معتمدة.</p></div>
      </div>
      <div className="grid g-2">
        {approvals.map((a) => (
          <div className="card card-pad" key={a.id}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <b style={{ fontSize: 14.5 }}>{a.title}</b>
              <span className="badge b-slate">{a.version}</span>
            </div>
            <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
              <span className="badge b-primary">{TYPE_LABEL[a.type] ?? a.type}</span>
              <span className={`badge ${a.status === "approved" ? "b-green" : a.status === "rejected" ? "b-rose" : a.status.includes("change") ? "b-amber" : "b-slate"}`}>
                {STATUS_LABEL[a.status] ?? a.status}
              </span>
              {a.decidedBy && <span className="faint" style={{ fontSize: 12 }}>بواسطة {a.decidedBy}</span>}
            </div>
            {mayApprove && a.status === "pending" && (
              <div className="row" style={{ gap: 8 }}>
                <form action={decideApproval}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="decision" value="approved" />
                  <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "6px 12px" }}>اعتماد</button>
                </form>
                <form action={decideApproval}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="decision" value="changes_requested" />
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px" }}>طلب تعديل</button>
                </form>
              </div>
            )}
            {!mayApprove && <div className="faint" style={{ fontSize: 12 }}>عرض فقط — لا تملك صلاحية الاعتماد.</div>}
          </div>
        ))}
        {approvals.length === 0 && <div className="faint">لا عناصر بانتظار الموافقة.</div>}
      </div>
    </>
  );
}
