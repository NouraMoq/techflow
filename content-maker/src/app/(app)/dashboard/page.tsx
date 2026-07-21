import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { IconBulb, IconWorkflow, IconCheck, IconChart } from "@/components/icons";
import { getTopHashtags } from "@/lib/hashtags";
import HashtagCloud from "@/components/HashtagCloud";

export default async function DashboardPage() {
  const s = await requireSession();
  const tenantId = s.tid; // tenant isolation boundary

  const [ideaCount, projCount, pendingApprovals, projects, creator, topTags] = await Promise.all([
    prisma.idea.count({ where: { tenantId, deletedAt: null } }),
    prisma.contentProject.count({ where: { tenantId, status: "production", deletedAt: null } }),
    prisma.approval.count({ where: { tenantId, status: "pending" } }),
    prisma.contentProject.findMany({
      where: { tenantId, deletedAt: null }, orderBy: { dueDate: "asc" }, take: 5,
    }),
    prisma.creator.findFirst({ where: { tenantId, deletedAt: null } }),
    getTopHashtags(tenantId, 10),
  ]);

  const stats = [
    { Icon: IconBulb, value: ideaCount, label: "أفكار نشطة" },
    { Icon: IconWorkflow, value: projCount, label: "مشاريع قيد الإنتاج" },
    { Icon: IconCheck, value: pendingApprovals, label: "بانتظار الموافقة" },
    { Icon: IconChart, value: "4.8M", label: "مشاهدات (تجريبي)" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>مرحبًا، {s.name.split(" ")[0]} 👋</h1>
          <p>لوحة {creator?.name ?? "حسابك"} — نظرة سريعة على المحتوى والإنتاج (بيانات فعلية من قاعدة البيانات).</p>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        {stats.map((st, i) => (
          <div className="stat" key={i}>
            <div className="st-ico"><st.Icon /></div>
            <div className="st-val">{st.value}</div>
            <div className="st-lbl">{st.label}</div>
          </div>
        ))}
      </div>

      {topTags.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <b style={{ fontSize: 15 }}>أبرز الهاشتاقات</b>
            <span className="faint" style={{ fontSize: 12 }}>الأكثر ارتباطًا بمحتواك · انقر للنسخ</span>
          </div>
          <HashtagCloud items={topTags} compact />
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>الإنتاج القادم</h3><span className="sub">أقرب المشاريع حسب الاستحقاق</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>المشروع</th><th>المرحلة</th><th>المسؤول</th><th>الاستحقاق</th></tr></thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td><b>{p.title}</b></td>
                  <td><span className="badge b-primary">{p.stageIndex + 1}. {WORKFLOW_STAGES[p.stageIndex]}</span></td>
                  <td>{p.ownerName ?? "—"}</td>
                  <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString("ar-SA") : "—"}</td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={4} className="faint" style={{ textAlign: "center", padding: 24 }}>لا مشاريع بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
