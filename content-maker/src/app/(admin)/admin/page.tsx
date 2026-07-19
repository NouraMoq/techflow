import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { IconMoney, IconUsers, IconGrid } from "@/components/icons";

export default async function AdminHome() {
  await requireAdmin();

  // Cross-tenant view (admin scope): list client tenants with their subscription/plan.
  const subs = await prisma.subscription.findMany({
    include: { tenant: true, plan: true },
    orderBy: { startedAt: "desc" },
  });
  const clients = await Promise.all(
    subs.map(async (sub) => {
      const [creator, ideas] = await Promise.all([
        prisma.creator.findFirst({ where: { tenantId: sub.tenantId } }),
        prisma.idea.count({ where: { tenantId: sub.tenantId, deletedAt: null } }),
      ]);
      return { sub, creatorName: creator?.name ?? sub.tenant.name, ideas };
    })
  );
  const mrr = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + s.plan.priceMonthly, 0);

  const stats = [
    { Icon: IconMoney, value: mrr.toLocaleString("ar-EG"), label: "الإيراد الشهري المتكرر (ر.س)" },
    { Icon: IconUsers, value: subs.length, label: "العملاء" },
    { Icon: IconGrid, value: subs.filter((s) => s.status === "active").length, label: "اشتراكات نشطة" },
  ];

  return (
    <>
      <div className="page-head">
        <div><h1>لوحة نوفاميتريكس</h1><p>إدارة العملاء والاشتراكات — عرض عبر جميع الحسابات.</p></div>
      </div>
      <div className="grid g-3" style={{ marginBottom: 16 }}>
        {stats.map((st, i) => (
          <div className="stat" key={i}><div className="st-ico"><st.Icon /></div><div className="st-val">{st.value}</div><div className="st-lbl">{st.label}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><h3>العملاء</h3><span className="sub">جميع الحسابات</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>العميل</th><th>الباقة</th><th>MRR</th><th>الحالة</th><th>الأفكار</th></tr></thead>
            <tbody>
              {clients.map(({ sub, creatorName, ideas }) => (
                <tr key={sub.id}>
                  <td><b>{creatorName}</b></td>
                  <td><span className="badge b-primary">{sub.plan.nameAr}</span></td>
                  <td>{sub.plan.priceMonthly.toLocaleString("ar-EG")}</td>
                  <td><span className={`badge ${sub.status === "active" ? "b-green" : "b-amber"}`}>{sub.status === "active" ? "نشط" : sub.status}</span></td>
                  <td>{ideas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
