import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { IDEA_STATUSES, PRIORITY_LABELS } from "@/lib/constants";
import { parseArr } from "@/lib/json";
import { can } from "@/lib/rbac";
import NewIdea from "./NewIdea";
import { moveIdea } from "./actions";

export default async function IdeasPage() {
  const s = await requireSession();

  const [ideas, pillars] = await Promise.all([
    prisma.idea.findMany({
      where: { tenantId: s.tid, deletedAt: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contentPillar.findMany({ where: { tenantId: s.tid }, select: { id: true, name: true, color: true } }),
  ]);
  const pillarColor = (id: string | null) => pillars.find((p) => p.id === id)?.color ?? "#64748b";
  const canEdit = can(s.role, "idea.edit");

  // Show the first 6 statuses as Kanban columns.
  const cols = IDEA_STATUSES.slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>بنك الأفكار</h1>
          <p>{ideas.length} فكرة — من المسودة إلى النشر. البيانات محفوظة في قاعدة البيانات ومعزولة حسب الحساب.</p>
        </div>
        <div className="actions">
          {can(s.role, "idea.create") && <NewIdea pillars={pillars.map((p) => ({ id: p.id, name: p.name }))} />}
        </div>
      </div>

      <div className="kanban">
        {cols.map((col) => {
          const items = ideas.filter((i) => i.status === col.key);
          return (
            <div className="kcol" key={col.key}>
              <div className="kcol-head">
                <span className="tag-dot" style={{ background: col.color }} />
                <b>{col.label}</b>
                <span className="cnt">{items.length}</span>
              </div>
              {items.map((i) => (
                <div className="kcard" key={i.id}>
                  <div className="row between" style={{ marginBottom: 6 }}>
                    <span className="tag-dot" style={{ background: pillarColor(i.pillarId) }} />
                    <span className={`badge ${i.priority === "high" ? "b-rose" : i.priority === "medium" ? "b-amber" : "b-slate"}`} style={{ fontSize: 10 }}>
                      {PRIORITY_LABELS[i.priority]}
                    </span>
                  </div>
                  <h4>{i.title}</h4>
                  <div className="row between faint" style={{ fontSize: 11.5, marginTop: 8 }}>
                    <span>انتشار {i.viralScore}%</span>
                    <span>ملاءمة {i.fitScore}%</span>
                  </div>
                  {parseArr(i.tagsJson).length > 0 && (
                    <div className="row wrap" style={{ gap: 5, marginTop: 8 }}>
                      {parseArr(i.tagsJson).map((t) => (
                        <span key={t} className="badge b-slate" style={{ fontSize: 10 }}>#{t}</span>
                      ))}
                    </div>
                  )}
                  {canEdit && i.status !== "published" && (
                    <form action={moveIdea} style={{ marginTop: 9 }}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="status" value={nextStatus(i.status)} />
                      <button className="btn btn-soft" style={{ fontSize: 12, padding: "5px 10px", width: "100%" }}>
                        نقل إلى: {IDEA_STATUSES.find((x) => x.key === nextStatus(i.status))?.label}
                      </button>
                    </form>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="faint" style={{ fontSize: 12, textAlign: "center", padding: "14px 0" }}>لا أفكار</div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// Advance an idea to the next pipeline status.
function nextStatus(current: string): string {
  const order = ["draft", "research", "proposed", "approved", "scripting", "scheduled", "production", "published"];
  const idx = order.indexOf(current);
  return idx < 0 || idx >= order.length - 1 ? current : order[idx + 1];
}
