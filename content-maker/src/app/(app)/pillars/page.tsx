import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { IconAlert } from "@/components/icons";

export default async function PillarsPage() {
  const s = await requireSession();
  const pillars = await prisma.contentPillar.findMany({
    where: { tenantId: s.tid }, orderBy: { targetPct: "desc" },
  });
  const total = pillars.reduce((sum, p) => sum + p.targetPct, 0);
  const balanced = total === 100;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>أعمدة المحتوى</h1>
          <p>توزيع المحتوى على الأعمدة الاستراتيجية مع مؤشر لكل عمود.</p>
        </div>
      </div>

      {!balanced && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <IconAlert />
          <div><b>الخطة غير متوازنة</b><p>مجموع النسب {total}٪ — عدّل التوزيع ليصبح ١٠٠٪.</p></div>
        </div>
      )}

      <div className="grid g-3">
        {pillars.map((p) => (
          <div className="card card-pad" key={p.id}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="row"><span className="tag-dot" style={{ background: p.color }} /><b style={{ fontSize: 15 }}>{p.name}</b></div>
              <span className="badge b-slate">{p.targetPct}٪</span>
            </div>
            <div className="bar"><i style={{ width: `${p.targetPct * 2.5}%`, background: p.color }} /></div>
            <div className="divider" />
            <div className="row between faint" style={{ fontSize: 12 }}>
              <span>المؤشر</span><b style={{ color: "var(--ink)" }}>{p.kpi ?? "—"}</b>
            </div>
          </div>
        ))}
        {pillars.length === 0 && <div className="faint">لا أعمدة بعد</div>}
      </div>
    </>
  );
}
