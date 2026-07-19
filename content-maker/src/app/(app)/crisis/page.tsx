import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { SEVERITY, crisisStatusMeta, nextCrisisStatus, APPROVAL_STATUS } from "@/lib/safety";
import { IconShield } from "@/components/icons";
import NewCrisis from "./NewCrisis";
import { advanceCrisis } from "./actions";

export default async function CrisisPage() {
  const s = await requireSession();
  const [cases, playbooks] = await Promise.all([
    prisma.crisisCase.findMany({ where: { tenantId: s.tid, deletedAt: null }, include: { playbook: true }, orderBy: { createdAt: "desc" } }),
    prisma.responsePlaybook.findMany({ where: { active: true }, orderBy: { key: "asc" } }),
  ]);
  const mayManage = can(s.role, "crisis.manage");

  return (
    <>
      <div className="page-head">
        <div><h1>مركز السمعة والأزمات</h1><p>تسجيل المواقف وإدارتها بأدلة استجابة (Playbooks) جاهزة قابلة للتعديل.</p></div>
        <div className="actions">{mayManage && <NewCrisis playbooks={playbooks.map((p) => ({ id: p.id, title: p.title }))} />}</div>
      </div>

      <div className="grid g-2" style={{ marginBottom: 16 }}>
        {cases.map((c) => {
          const sev = SEVERITY[c.severity] ?? SEVERITY.medium;
          const st = crisisStatusMeta(c.status);
          const appr = APPROVAL_STATUS[c.approvalStatus] ?? APPROVAL_STATUS.draft;
          return (
            <div className="card card-pad" key={c.id}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 15 }}>{c.title}</b>
                <span className={`badge ${sev.cls}`}>خطورة {sev.label}</span>
              </div>
              <div className="grid g-2" style={{ gap: 8, fontSize: 12.5, marginBottom: 10 }}>
                <div><span className="faint">المصدر</span><br /><b>{c.source ?? "—"}</b></div>
                <div><span className="faint">المسؤول</span><br /><b>{c.responderName ?? "—"}</b></div>
                <div><span className="faint">الحالة</span><br /><span className={`badge ${st.cls}`}>{st.label}</span></div>
                <div><span className="faint">اعتماد الرد</span><br /><span className={`badge ${appr.cls}`}>{appr.label}</span></div>
              </div>
              {c.suggestedResponse && <div className="callout info" style={{ padding: "9px 12px", marginBottom: 6 }}><IconShield /><div><b style={{ fontSize: 12.5 }}>الرد المقترح</b><p>{c.suggestedResponse}</p></div></div>}
              {c.forbiddenResponse && <div className="callout warn" style={{ padding: "9px 12px", marginBottom: 6 }}><IconShield /><div><b style={{ fontSize: 12.5 }}>ردود ممنوعة</b><p>{c.forbiddenResponse}</p></div></div>}
              <div className="row between" style={{ marginTop: 6 }}>
                {c.playbook && <span className="badge b-slate">Playbook: {c.playbook.title}</span>}
                {mayManage && c.status !== "closed" && (
                  <form action={advanceCrisis}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn btn-soft" style={{ fontSize: 12, padding: "5px 10px" }}>
                      تحديث الحالة → {crisisStatusMeta(nextCrisisStatus(c.status)).label}
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
        {cases.length === 0 && <div className="faint">لا مواقف مسجّلة.</div>}
      </div>

      <div className="card">
        <div className="card-head"><h3>أدلة الاستجابة الجاهزة</h3><span className="sub">قابلة للتعديل من لوحة نوفاميتريكس</span></div>
        <div className="card-pad">
          <div className="grid g-4">
            {playbooks.map((p) => (
              <div className="card card-pad" key={p.id} style={{ textAlign: "center" }}>
                <div className="stat" style={{ border: "none", padding: 0 }}><div className="st-ico" style={{ margin: "0 auto 8px", background: "var(--rose-tint)", color: "var(--rose)" }}><IconShield /></div></div>
                <b style={{ fontSize: 12.5 }}>{p.title}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
