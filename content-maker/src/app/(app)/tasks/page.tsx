import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PRIORITY_LABELS } from "@/lib/constants";

const GROUPS: [string, string][] = [
  ["in_progress", "قيد التنفيذ"], ["review", "بانتظار المراجعة"], ["todo", "لم تبدأ"], ["done", "مكتملة"],
];

export default async function TasksPage() {
  const s = await requireSession();
  const tasks = await prisma.task.findMany({ where: { tenantId: s.tid }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <div className="page-head">
        <div><h1>المهام</h1><p>مهام متصلة بالمحتوى والحملات — عرض حسب الحالة.</p></div>
      </div>
      <div className="kanban">
        {GROUPS.map(([key, label]) => {
          const items = tasks.filter((t) => t.status === key);
          return (
            <div className="kcol" key={key}>
              <div className="kcol-head"><b>{label}</b><span className="cnt">{items.length}</span></div>
              {items.map((t) => (
                <div className="kcard" key={t.id}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <span className={`badge ${t.priority === "high" ? "b-rose" : t.priority === "medium" ? "b-amber" : "b-slate"}`} style={{ fontSize: 10 }}>{PRIORITY_LABELS[t.priority]}</span>
                  </div>
                  <h4 style={t.done ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>{t.title}</h4>
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>{t.ownerName ?? "—"}</div>
                </div>
              ))}
              {items.length === 0 && <div className="faint" style={{ fontSize: 12, textAlign: "center", padding: "12px 0" }}>—</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
