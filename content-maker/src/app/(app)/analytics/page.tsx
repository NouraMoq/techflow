import { requireSession } from "@/lib/session";
import { IconChart } from "@/components/icons";

// Analytics uses DEMO data in MVP (no analytics ingestion tables yet).
// Documented in docs/roadmap-ar.md — official data sources / manual entry come later.
export default async function AnalyticsPage() {
  await requireSession();
  const kpis = [
    { value: "4.8M", label: "المشاهدات (٣٠ يوم)" },
    { value: "7.8%", label: "معدل التفاعل" },
    { value: "+34.2K", label: "متابعون جدد" },
    { value: "61%", label: "نسبة إكمال الفيديو" },
  ];
  const months = [
    { m: "فبراير", a: 40 }, { m: "مارس", a: 55 }, { m: "أبريل", a: 48 },
    { m: "مايو", a: 70 }, { m: "يونيو", a: 82 }, { m: "يوليو", a: 95 },
  ];
  return (
    <>
      <div className="page-head">
        <div><h1>التحليلات</h1><p>بيانات تجريبية في MVP — قابلة للربط لاحقًا بالمصادر الرسمية أو الإدخال اليدوي.</p></div>
      </div>
      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconChart />
        <div><b>ملاحظة</b><p>هذه اللوحة تعرض بيانات تجريبية لأغراض العرض. تكامل مصادر البيانات الرسمية مخطط في المرحلة الثانية.</p></div>
      </div>
      <div className="grid g-4" style={{ marginBottom: 16 }}>
        {kpis.map((k) => (
          <div className="stat" key={k.label}><div className="st-val">{k.value}</div><div className="st-lbl">{k.label}</div></div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><h3>نمو المشاهدات (شهر بشهر)</h3></div>
        <div className="card-pad">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180 }}>
            {months.map((m) => (
              <div key={m.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: 22, height: `${m.a}%`, background: "var(--primary)", borderRadius: "6px 6px 0 0" }} />
                <small className="faint" style={{ fontSize: 11, fontWeight: 700 }}>{m.m}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
