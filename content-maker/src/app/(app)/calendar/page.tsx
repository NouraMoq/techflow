import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { CALENDAR_TYPES, calType, DOW, MONTHS_AR, monthGrid, type CalEvent } from "@/lib/editorial";
import { IconAlert } from "@/components/icons";
import NewCalItem from "./NewCalItem";

export default async function CalendarPage({ searchParams }: { searchParams: { y?: string; m?: string } }) {
  const s = await requireSession();
  // Default to July 2026 (the seed data window). Month is 1-based in the URL.
  const year = Number(searchParams.y) || 2026;
  const month1 = Math.min(12, Math.max(1, Number(searchParams.m) || 7));
  const m0 = month1 - 1;
  const start = new Date(year, m0, 1);
  const end = new Date(year, m0 + 1, 1);
  const dayOf = (d: Date | null) => (d ? new Date(d).getDate() : 0);

  // Aggregate events from multiple sources (all tenant-scoped).
  const [manual, shoots, deliverables, contracts, invoices] = await Promise.all([
    prisma.editorialCalendarItem.findMany({ where: { tenantId: s.tid, deletedAt: null, date: { gte: start, lt: end } } }),
    prisma.shootSession.findMany({ where: { tenantId: s.tid, deletedAt: null, date: { gte: start, lt: end } } }),
    prisma.deliverable.findMany({ where: { campaign: { tenantId: s.tid }, dueDate: { gte: start, lt: end } }, include: { campaign: { include: { brand: true } } } }),
    prisma.contract.findMany({ where: { tenantId: s.tid, deletedAt: null, endDate: { gte: start, lt: end } }, include: { brand: true } }),
    prisma.invoice.findMany({ where: { tenantId: s.tid, dueDate: { gte: start, lt: end } } }),
  ]);

  const events: CalEvent[] = [
    ...manual.map((i) => ({ day: dayOf(i.date), type: i.type, title: i.title })),
    ...shoots.map((sh) => ({ day: dayOf(sh.date), type: "shoot", title: `تصوير: ${sh.name}` })),
    ...deliverables.map((d) => ({ day: dayOf(d.dueDate), type: "deliverable", title: `تسليم: ${d.title}` })),
    ...contracts.map((c) => ({ day: dayOf(c.endDate), type: "contract", title: `نهاية عقد: ${c.brand?.name ?? ""}` })),
    ...invoices.map((inv) => ({ day: dayOf(inv.dueDate), type: "contract", title: `فاتورة: ${inv.number}` })),
  ].filter((e) => e.day > 0);

  const byDay = new Map<number, CalEvent[]>();
  for (const e of events) { const a = byDay.get(e.day) ?? []; a.push(e); byDay.set(e.day, a); }

  const cells = monthGrid(year, m0);
  const now = new Date();
  const isToday = (d: number) => now.getFullYear() === year && now.getMonth() === m0 && now.getDate() === d;

  const prev = m0 === 0 ? { y: year - 1, m: 12 } : { y: year, m: m0 };
  const next = m0 === 11 ? { y: year + 1, m: 1 } : { y: year, m: m0 + 2 };

  const publishCount = events.filter((e) => e.type === "publish").length;
  const noPublish = events.filter((e) => e.type === "no_publish").length;

  return (
    <>
      <div className="page-head">
        <div><h1>التقويم التحريري</h1><p>{MONTHS_AR[m0]} {year} — تخطيط ونشر وتصوير وتسليمات وعقود في مكان واحد.</p></div>
        <div className="actions">
          <Link href={`/calendar?y=${prev.y}&m=${prev.m}`} className="btn btn-ghost">← السابق</Link>
          <Link href={`/calendar?y=${next.y}&m=${next.m}`} className="btn btn-ghost">التالي →</Link>
          <NewCalItem />
        </div>
      </div>

      {publishCount === 0 && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <IconAlert /><div><b>لا نشر مخطّط هذا الشهر</b><p>لم يُسجَّل أي عنصر نشر في {MONTHS_AR[m0]} — راجع خطة المحتوى.</p></div>
        </div>
      )}

      {/* Legend */}
      <div className="row wrap" style={{ gap: 12, marginBottom: 14 }}>
        {Object.entries(CALENDAR_TYPES).filter(([k]) => ["publish", "shoot", "approval", "campaign", "deliverable", "event", "contract", "no_publish"].includes(k)).map(([k, v]) => (
          <span key={k} className="row faint" style={{ gap: 6, fontSize: 12 }}>
            <span className="tag-dot" style={{ background: v.color }} /> {v.label}
          </span>
        ))}
      </div>

      <div className="card card-pad">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {DOW.map((d) => <div key={d} style={{ fontSize: 11.5, fontWeight: 800, color: "var(--faint)", textAlign: "center", paddingBottom: 4 }}>{d}</div>)}
          {cells.map((day, i) => (
            <div key={i} style={{
              minHeight: 96, background: day ? "var(--surface)" : "var(--surface-2)", border: "1px solid var(--border)",
              borderRadius: 10, padding: 7, opacity: day ? 1 : 0.5,
              ...(day && isToday(day) ? { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-soft)" } : {}),
            }}>
              {day && <div style={{ fontWeight: 800, color: "var(--muted)", fontSize: 12 }}>{day}</div>}
              {day && (byDay.get(day) ?? []).map((e, j) => {
                const t = calType(e.type);
                return (
                  <div key={j} title={e.title} style={{
                    marginTop: 4, padding: "3px 6px", borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                    background: t.color + "22", color: t.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{e.title}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="row faint" style={{ fontSize: 12.5, marginTop: 12, gap: 16 }}>
        <span>عناصر النشر: <b style={{ color: "var(--ink)" }}>{publishCount}</b></span>
        <span>أيام عدم النشر: <b style={{ color: "var(--ink)" }}>{noPublish}</b></span>
        <span>إجمالي الأحداث: <b style={{ color: "var(--ink)" }}>{events.length}</b></span>
      </div>
    </>
  );
}
