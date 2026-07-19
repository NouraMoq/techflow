import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";

const ACTION_LABEL: Record<string, string> = {
  "auth.login": "تسجيل دخول", "idea.create": "إنشاء فكرة", "idea.move": "نقل فكرة",
  "approval.decide": "قرار موافقة",
};

export default async function AdminAudit() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" }, take: 50, include: { user: true, tenant: true },
  });

  return (
    <>
      <div className="page-head">
        <div><h1>سجل التدقيق</h1><p>Audit Log — سجل الأحداث الحساسة عبر الحسابات، دون تسجيل أي بيانات سرية.</p></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الوقت</th><th>المستخدم</th><th>الحساب</th><th>الإجراء</th><th>العنصر</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="faint">{new Date(l.createdAt).toLocaleString("ar-SA")}</td>
                  <td><b>{l.user?.name ?? "النظام"}</b></td>
                  <td className="faint">{l.tenant?.name ?? "—"}</td>
                  <td>{ACTION_LABEL[l.action] ?? l.action}</td>
                  <td className="faint">{l.entity ?? "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="faint" style={{ textAlign: "center", padding: 24 }}>لا أحداث بعد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
