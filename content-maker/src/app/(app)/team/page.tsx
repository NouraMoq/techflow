import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ROLE_LABELS, permissionsFor, type RoleKey, type Permission } from "@/lib/rbac";

const PERM_COLS: { key: Permission; label: string }[] = [
  { key: "idea.create", label: "إنشاء فكرة" },
  { key: "script.write", label: "كتابة سيناريو" },
  { key: "content.approve", label: "اعتماد" },
  { key: "content.publish", label: "نشر" },
  { key: "analytics.view", label: "التحليلات" },
  { key: "finance.view", label: "بيانات مالية" },
];

export default async function TeamPage() {
  const s = await requireSession();
  const memberships = await prisma.membership.findMany({
    where: { tenantId: s.tid, scope: "client" },
    include: { user: true },
  });

  const roles = Array.from(new Set(memberships.map((m) => m.role)));

  return (
    <>
      <div className="page-head">
        <div><h1>الفريق والصلاحيات</h1><p>نظام صلاحيات RBAC — من يستطيع فعل ماذا داخل هذا الحساب.</p></div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        {memberships.map((m) => (
          <div className="card card-pad" key={m.id} style={{ textAlign: "center" }}>
            <div className="avatar" style={{ width: 52, height: 52, margin: "0 auto 10px", fontSize: 20 }}>{m.user.name.charAt(0)}</div>
            <b style={{ fontSize: 14 }}>{m.user.name}</b>
            <div className="faint" style={{ fontSize: 12 }}>{ROLE_LABELS[m.role as RoleKey] ?? m.role}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head"><h3>مصفوفة الصلاحيات</h3><span className="sub">RBAC</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الدور</th>{PERM_COLS.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>
              {roles.map((r) => {
                const perms = permissionsFor(r);
                return (
                  <tr key={r}>
                    <td><b>{ROLE_LABELS[r as RoleKey] ?? r}</b></td>
                    {PERM_COLS.map((c) => (
                      <td key={c.key}>{perms.includes(c.key)
                        ? <span style={{ color: "var(--green)", fontWeight: 800 }}>✓</span>
                        : <span className="faint">✗</span>}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
