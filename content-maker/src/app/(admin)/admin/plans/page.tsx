import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { parseObj } from "@/lib/json";

type Limits = { creators?: unknown; users?: unknown; social?: unknown; projects?: unknown; storageGb?: unknown; analytics?: string; ai?: string; support?: string };

export default async function AdminPlans() {
  await requireAdmin();
  const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } });

  return (
    <>
      <div className="page-head">
        <div><h1>الباقات والأسعار</h1><p>أسعار أولية لاختبار السوق — قابلة للتعديل (لا تشمل ضريبة القيمة المضافة).</p></div>
      </div>
      <div className="grid g-3">
        {plans.map((p) => {
          const l = parseObj<Limits>(p.limitsJson, {});
          const rows: [string, unknown][] = [
            ["صناع المحتوى", l.creators], ["المستخدمون", l.users], ["الحسابات", l.social],
            ["المشاريع/شهر", l.projects], ["التخزين (GB)", l.storageGb],
            ["التحليلات", l.analytics], ["الذكاء الاصطناعي", l.ai], ["الدعم", l.support],
          ];
          return (
            <div className="card card-pad" key={p.id} style={p.key === "pro" ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-soft)" } : undefined}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 16 }}>{p.nameAr}</b>
                {p.managed ? <span className="badge b-violet">مُدارة</span> : <span className="badge b-slate">ذاتية</span>}
              </div>
              <div className="row" style={{ alignItems: "baseline", gap: 4 }}>
                <span className="st-val" style={{ fontSize: 26 }}>{p.priceMonthly.toLocaleString("ar-EG")}</span>
                <span className="faint">ر.س/شهر</span>
              </div>
              <div className="faint" style={{ fontSize: 12 }}>سنويًا {p.priceAnnual.toLocaleString("ar-EG")} · تأسيس {p.setupFee.toLocaleString("ar-EG")}</div>
              <div className="divider" />
              {rows.map(([k, v]) => (
                <div className="row between" key={k} style={{ fontSize: 12.5, padding: "3px 0" }}>
                  <span className="faint">{k}</span><b>{String(v ?? "—")}</b>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
