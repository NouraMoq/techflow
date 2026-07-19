import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { IconAlert } from "@/components/icons";
import {
  CONTRACT_TYPE_LABEL, PAYMENT_STATUS, INVOICE_STATUS, OBLIGATION_LABEL, sar, dateAr,
} from "@/lib/commerce";

export default async function ContractsPage() {
  const s = await requireSession();

  const [contracts, invoices, obligations] = await Promise.all([
    prisma.contract.findMany({
      where: { tenantId: s.tid, deletedAt: null },
      include: { brand: true, obligations: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({ where: { tenantId: s.tid }, orderBy: { dueDate: "asc" } }),
    prisma.contractObligation.findMany({
      where: { contract: { tenantId: s.tid } },
      include: { contract: { include: { brand: true } } },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  // Obligations that must not be forgotten: overdue first, then upcoming.
  const alertable = obligations.filter((o) => o.status !== "done");

  return (
    <>
      <div className="page-head">
        <div><h1>العقود والالتزامات</h1><p>سجل العقود مع تنبيهات للالتزامات التي قد تُنسى.</p></div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconAlert />
        <div><b>تنبيه قانوني</b><p>القوالب تشغيلية وتحتاج مراجعة قانونية من مختص مرخّص — ليست بديلًا عن المحامي.</p></div>
      </div>

      {alertable.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>التزامات تحتاج متابعة</h3><span className="sub">{alertable.length} تنبيه</span></div>
          <div className="card-pad" style={{ paddingTop: 6 }}>
            {alertable.map((o) => (
              <div className="row between" key={o.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="row">
                  <span className={`badge ${o.status === "overdue" ? "b-rose" : "b-amber"}`}>{OBLIGATION_LABEL[o.type] ?? o.type}</span>
                  <b style={{ fontSize: 13.5 }}>{o.title}</b>
                  <span className="faint" style={{ fontSize: 12 }}>· {o.contract.brand?.name ?? "—"}</span>
                </div>
                <span className="faint" style={{ fontSize: 12.5 }}>الاستحقاق {dateAr(o.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid g-2" style={{ marginBottom: 16 }}>
        {contracts.map((c) => {
          const pay = PAYMENT_STATUS[c.paymentStatus] ?? PAYMENT_STATUS.pending;
          return (
            <div className="card card-pad" key={c.id}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 15 }}>{c.brand?.name ?? "عقد"}</b>
                <span className="badge b-primary">{CONTRACT_TYPE_LABEL[c.type] ?? c.type}</span>
              </div>
              <div className="grid g-2" style={{ gap: 8, fontSize: 12.5, marginBottom: 8 }}>
                <div><span className="faint">القيمة</span><br /><b>{sar(c.value)}</b></div>
                <div><span className="faint">المدة</span><br /><b>{dateAr(c.startDate)} - {dateAr(c.endDate)}</b></div>
                <div><span className="faint">الحصرية</span><br /><b>{c.exclusivity ?? "—"}</b></div>
                <div><span className="faint">الدفع</span><br /><span className={`badge ${pay.cls}`}>{pay.label}</span></div>
              </div>
              <div className="faint" style={{ fontSize: 12 }}>حقوق الاستخدام: {c.usageRights ?? "—"} · التزامات: {c.obligations.length}</div>
            </div>
          );
        })}
        {contracts.length === 0 && <div className="faint">لا عقود بعد</div>}
      </div>

      <div className="card">
        <div className="card-head"><h3>الفواتير والمستحقات</h3></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الرقم</th><th>العلامة</th><th>المبلغ</th><th>الاستحقاق</th><th>الحالة</th></tr></thead>
            <tbody>
              {invoices.map((inv) => {
                const st = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.due;
                return (
                  <tr key={inv.id}>
                    <td><b>{inv.number}</b></td>
                    <td>{inv.brandName ?? "—"}</td>
                    <td>{sar(inv.amount)}</td>
                    <td>{dateAr(inv.dueDate)}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  </tr>
                );
              })}
              {invoices.length === 0 && <tr><td colSpan={5} className="faint" style={{ textAlign: "center", padding: 20 }}>لا فواتير بعد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
