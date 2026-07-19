import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { SCRIPT_STATUS } from "@/lib/editorial";
import { IconScript } from "@/components/icons";
import NewScript from "./NewScript";

export default async function ScriptsPage() {
  const s = await requireSession();
  const [scripts, ideas] = await Promise.all([
    prisma.script.findMany({
      where: { tenantId: s.tid, deletedAt: null },
      include: { idea: true, _count: { select: { versions: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.idea.findMany({ where: { tenantId: s.tid, deletedAt: null }, select: { id: true, title: true } }),
  ]);

  return (
    <>
      <div className="page-head">
        <div><h1>السيناريوهات</h1><p>محرر سيناريو احترافي — مع إصدارات، إفصاح إعلاني، ووضع Teleprompter.</p></div>
        <div className="actions">{can(s.role, "script.write") && <NewScript ideas={ideas} />}</div>
      </div>

      <div className="grid g-2">
        {scripts.map((sc) => {
          const st = SCRIPT_STATUS[sc.status] ?? SCRIPT_STATUS.draft;
          return (
            <Link key={sc.id} href={`/scripts/${sc.id}`} className="card card-pad" style={{ display: "block" }}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="row" style={{ gap: 10, minWidth: 0 }}>
                  <span className="st-ico"><IconScript /></span>
                  <b style={{ fontSize: 14.5 }}>{sc.title}</b>
                </div>
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </div>
              {sc.hook && <div className="faint" style={{ fontSize: 12.5 }}>Hook: {sc.hook}</div>}
              <div className="row between faint" style={{ fontSize: 11.5, marginTop: 10 }}>
                <span>{sc.idea ? `مرتبط: ${sc.idea.title}` : "غير مرتبط بفكرة"}</span>
                <span>v{sc.version} · {sc._count.versions} إصدار{sc.disclosure ? " · إعلاني" : ""}</span>
              </div>
            </Link>
          );
        })}
        {scripts.length === 0 && <div className="faint">لا سيناريوهات بعد.</div>}
      </div>
    </>
  );
}
