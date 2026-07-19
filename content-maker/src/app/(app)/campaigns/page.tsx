import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { OPPORTUNITY_STAGES, opportunityStageLabel, sar, dateAr } from "@/lib/commerce";
import NewBrand from "./NewBrand";
import { advanceOpportunity } from "./actions";

export default async function CampaignsPage() {
  const s = await requireSession();

  const [opportunities, brands, campaigns] = await Promise.all([
    prisma.opportunity.findMany({ where: { tenantId: s.tid, deletedAt: null }, include: { brand: true }, orderBy: { createdAt: "desc" } }),
    prisma.brand.findMany({ where: { tenantId: s.tid, deletedAt: null }, include: { contacts: true, _count: { select: { opportunities: true } } } }),
    prisma.campaign.findMany({ where: { tenantId: s.tid, deletedAt: null }, include: { brand: true, deliverables: true } }),
  ]);
  const mayManage = can(s.role, "contracts.view");
  const cols = OPPORTUNITY_STAGES.slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div><h1>الحملات والإعلانات</h1><p>CRM مصغّر لإدارة العلامات والفرص التجارية — {opportunities.length} فرصة نشطة.</p></div>
        <div className="actions">{mayManage && <NewBrand />}</div>
      </div>

      <div className="kanban">
        {cols.map((col) => {
          const items = opportunities.filter((o) => o.stage === col.key);
          const total = items.reduce((sum, o) => sum + (o.dealValue ?? 0), 0);
          return (
            <div className="kcol" key={col.key}>
              <div className="kcol-head"><b>{col.label}</b><span className="cnt">{items.length}</span></div>
              {items.map((o) => (
                <div className="kcard" key={o.id}>
                  <h4>{o.brand.name}</h4>
                  <div className="faint" style={{ fontSize: 11.5 }}>{o.title}</div>
                  <div className="row between" style={{ marginTop: 8 }}>
                    <b style={{ fontSize: 13 }}>{o.dealValue ? sar(o.dealValue) : "—"}</b>
                    {o.brand.sector && <span className="badge b-slate" style={{ fontSize: 10 }}>{o.brand.sector}</span>}
                  </div>
                  {mayManage && o.stage !== "collected" && (
                    <form action={advanceOpportunity} style={{ marginTop: 9 }}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="btn btn-soft" style={{ fontSize: 12, padding: "5px 10px", width: "100%" }}>
                        تقديم إلى: {opportunityStageLabel(require_next(o.stage))}
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {items.length === 0 && <div className="faint" style={{ fontSize: 12, textAlign: "center", padding: "12px 0" }}>—</div>}
              {items.length > 0 && <div className="faint" style={{ fontSize: 11, textAlign: "center", marginTop: 4 }}>{sar(total)}</div>}
            </div>
          );
        })}
      </div>

      <div className="grid g-12" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><h3>العلامات التجارية</h3></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>العلامة</th><th>القطاع</th><th>جهة الاتصال</th><th>الفرص</th></tr></thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id}>
                    <td><b>{b.name}</b></td>
                    <td>{b.sector ?? "—"}</td>
                    <td>{b.contacts[0]?.name ?? "—"}</td>
                    <td>{b._count.opportunities}</td>
                  </tr>
                ))}
                {brands.length === 0 && <tr><td colSpan={4} className="faint" style={{ textAlign: "center", padding: 20 }}>لا علامات بعد</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>الحملات النشطة</h3></div>
          <div className="card-pad">
            {campaigns.map((c) => {
              const done = c.deliverables.filter((d) => d.status === "delivered" || d.status === "approved").length;
              return (
                <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="row between"><b style={{ fontSize: 13.5 }}>{c.name}</b><span className="badge b-primary">{c.brand.name}</span></div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>
                    {dateAr(c.startDate)} — {dateAr(c.endDate)} · التسليمات {done}/{c.deliverables.length}
                  </div>
                  <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${c.deliverables.length ? (done / c.deliverables.length) * 100 : 0}%` }} /></div>
                </div>
              );
            })}
            {campaigns.length === 0 && <div className="faint">لا حملات بعد</div>}
          </div>
        </div>
      </div>
    </>
  );
}

// Small local helper to avoid importing the client action's util into JSX text.
function require_next(stage: string): string {
  const order = OPPORTUNITY_STAGES.map((s) => s.key);
  const i = order.indexOf(stage);
  return i < 0 || i >= order.length - 1 ? stage : order[i + 1];
}
