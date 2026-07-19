import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseArr } from "@/lib/json";
import { shootStatusMeta, nextShootStatus, SHOT_STATUS } from "@/lib/production";
import { sar, dateAr } from "@/lib/commerce";
import { IconCamera, IconUsers } from "@/components/icons";
import NewShoot from "./NewShoot";
import { advanceShootStatus, setShotStatus } from "./actions";

export default async function ShootsPage() {
  const s = await requireSession();
  const sessions = await prisma.shootSession.findMany({
    where: { tenantId: s.tid, deletedAt: null },
    include: { shots: { orderBy: { order: "asc" } } },
    orderBy: { date: "asc" },
  });
  const mayManage = can(s.role, "shoot.manage");

  return (
    <>
      <div className="page-head">
        <div><h1>جلسات التصوير</h1><p>إدارة أيام التصوير مع قائمة اللقطات (Call Sheet) وحالة كل مقطع.</p></div>
        <div className="actions">{mayManage && <NewShoot />}</div>
      </div>

      {sessions.map((sess) => {
        const st = shootStatusMeta(sess.status);
        const crew = parseArr(sess.crewJson);
        const done = sess.shots.filter((sh) => sh.status === "shot" || sh.status === "approved").length;
        return (
          <div className="card" key={sess.id} style={{ marginBottom: 16 }}>
            <div className="card-head">
              <span className="stat" style={{ border: "none", padding: 0 }}>
                <span className="st-ico"><IconCamera /></span>
              </span>
              <div style={{ minWidth: 0 }}>
                <h3>{sess.name}</h3>
                <div className="sub">{dateAr(sess.date)}{sess.location ? ` · ${sess.location}` : ""}</div>
              </div>
              <div className="hactions" style={{ alignItems: "center" }}>
                <span className={`badge ${st.cls}`}>{st.label}</span>
                {mayManage && sess.status !== "done" && sess.status !== "cancelled" && (
                  <form action={advanceShootStatus}>
                    <input type="hidden" name="id" value={sess.id} />
                    <button className="btn btn-soft" style={{ fontSize: 12, padding: "5px 10px" }}>
                      → {shootStatusMeta(nextShootStatus(sess.status)).label}
                    </button>
                  </form>
                )}
              </div>
            </div>
            <div className="card-pad">
              <div className="row wrap" style={{ gap: 14, marginBottom: 12, fontSize: 12.5 }}>
                <span className="faint"><IconUsers /> {crew.length ? crew.join("، ") : "لا فريق بعد"}</span>
                <span className="faint">التكلفة: <b style={{ color: "var(--ink)" }}>{sar(sess.cost)}</b></span>
                <span className="faint">اللقطات: <b style={{ color: "var(--ink)" }}>{done}/{sess.shots.length}</b></span>
              </div>
              {sess.notes && <div className="callout info" style={{ padding: "8px 12px", marginBottom: 12 }}><IconCamera /><div><p style={{ fontSize: 12.5 }}>{sess.notes}</p></div></div>}

              {/* Shot list (Call Sheet) */}
              {sess.shots.map((sh) => {
                const shSt = SHOT_STATUS[sh.status] ?? SHOT_STATUS.todo;
                return (
                  <div key={sh.id} className="row between" style={{ padding: "9px 0", borderBottom: "1px solid var(--border)", gap: 10 }}>
                    <div className="row" style={{ gap: 10, minWidth: 0 }}>
                      <span className="u-av" style={{ background: "var(--surface-2)", color: "var(--muted)", width: 26, height: 26, fontSize: 11 }}>{sh.order + 1}</span>
                      <div style={{ minWidth: 0 }}>
                        <b style={{ fontSize: 13.5 }}>{sh.title}</b>
                        {sh.scenario && <div className="faint" style={{ fontSize: 11.5 }}>{sh.scenario}{sh.wardrobe ? ` · ${sh.wardrobe}` : ""}</div>}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={`badge ${shSt.cls}`}>{shSt.label}</span>
                      {mayManage && sh.status !== "approved" && (
                        <form action={setShotStatus}>
                          <input type="hidden" name="shotId" value={sh.id} />
                          <input type="hidden" name="status" value={sh.status === "todo" ? "shot" : "approved"} />
                          <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: "4px 9px" }}>
                            {sh.status === "todo" ? "تم التصوير" : "اعتماد"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
              {sess.shots.length === 0 && <div className="faint" style={{ fontSize: 12.5 }}>لا لقطات — أضف قائمة اللقطات.</div>}
            </div>
          </div>
        );
      })}
      {sessions.length === 0 && <div className="card card-pad faint" style={{ textAlign: "center" }}>لا جلسات تصوير بعد.</div>}
    </>
  );
}
