import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { isLiveConfigured } from "@/lib/integrations/registry";
import { PUBLISH_STATUS, INTEGRATION_STATUS, modeLabel } from "@/lib/integrations/labels";
import { WORKFLOW_STAGES } from "@/lib/constants";
import { IconAlert, IconShield } from "@/components/icons";
import NewPublish from "./NewPublish";
import { runPublish, recordManualPost } from "./actions";

export default async function PublishingPage() {
  const s = await requireSession();
  const [jobs, integration, readyProjects] = await Promise.all([
    prisma.publishJob.findMany({ where: { tenantId: s.tid }, include: { project: true }, orderBy: { createdAt: "desc" } }),
    prisma.integration.findUnique({ where: { tenantId_provider: { tenantId: s.tid, provider: "tiktok" } } }),
    // Projects near the end of the workflow are candidates for publishing.
    prisma.contentProject.findMany({ where: { tenantId: s.tid, deletedAt: null, stageIndex: { gte: 12 } }, orderBy: { dueDate: "asc" } }),
  ]);
  const connected = integration?.status === "connected";
  const mayPublish = can(s.role, "content.publish");
  const live = isLiveConfigured("tiktok");
  const itMeta = INTEGRATION_STATUS[integration?.status ?? "disconnected"];

  return (
    <>
      <div className="page-head">
        <div><h1>النشر على TikTok</h1><p>تجهيز المحتوى ونشره عبر طبقة التكامل. لا يُدّعى نجاح النشر حتى تؤكده الواجهة الرسمية.</p></div>
        <div className="actions">
          {mayPublish && <NewPublish projects={readyProjects.map((p) => ({ id: p.id, title: p.title }))} disabled={!connected} />}
        </div>
      </div>

      <div className={`callout ${connected ? "info" : "warn"}`} style={{ marginBottom: 16 }}>
        <IconShield />
        <div>
          <b>حالة TikTok: {itMeta.label} · {modeLabel(integration?.mode ?? "mock")}</b>
          <p>
            {connected
              ? (live ? "متصل بالوضع المباشر." : "متصل بالوضع التجريبي (Mock) — النشر محاكاة معلَّمة بوضوح، دون منشور حقيقي.")
              : "غير متصل — اربط TikTok من صفحة التكاملات قبل التجهيز. يمكنك دائمًا تسجيل رابط منشور نُشر يدويًا (المرحلة الأولى)."}
          </p>
        </div>
      </div>

      {/* Ready-to-publish content from the workflow */}
      {readyProjects.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>محتوى جاهز للنشر</h3><span className="sub">مشاريع في نهاية خط الإنتاج</span></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>المشروع</th><th>المرحلة</th><th>الاستحقاق</th></tr></thead>
              <tbody>
                {readyProjects.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.title}</b></td>
                    <td><span className="badge b-primary">{p.stageIndex + 1}. {WORKFLOW_STAGES[p.stageIndex]}</span></td>
                    <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString("ar-SA") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Publish queue */}
      <div className="card">
        <div className="card-head"><h3>قائمة النشر</h3><span className="sub">{jobs.length} مهمة</span></div>
        <div className="card-pad">
          {jobs.map((j) => {
            const st = PUBLISH_STATUS[j.status] ?? PUBLISH_STATUS.preparing;
            return (
              <div key={j.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="row between wrap" style={{ gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      <span className="badge b-slate" style={{ fontSize: 10 }}>{modeLabel(j.mode)}</span>
                      {j.project && <b style={{ fontSize: 13.5 }}>{j.project.title}</b>}
                    </div>
                    <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>{j.caption}</div>
                    {j.externalUrl && <a href={j.externalUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--primary-ink)", fontWeight: 700 }}>{j.externalUrl}</a>}
                    {j.error && <div className="faint" style={{ fontSize: 12, color: "var(--rose)" }}>⚠ {j.error}</div>}
                  </div>
                  {mayPublish && (
                    <div className="row wrap" style={{ gap: 6 }}>
                      {(j.status === "ready" || j.status === "failed") && (
                        <form action={runPublish}>
                          <input type="hidden" name="id" value={j.id} />
                          <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "6px 12px" }}>نشر عبر التكامل</button>
                        </form>
                      )}
                      {j.status !== "published" && (
                        <form action={recordManualPost} className="row" style={{ gap: 4 }}>
                          <input type="hidden" name="id" value={j.id} />
                          <input className="inp" name="url" placeholder="https://tiktok.com/@…/video/…" style={{ width: 200, padding: "6px 10px", fontSize: 12 }} required />
                          <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px" }}>تسجيل رابط يدوي</button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {jobs.length === 0 && (
            <div className="faint" style={{ textAlign: "center", padding: 24 }}>
              <IconAlert /><div style={{ marginTop: 8 }}>لا مهام نشر بعد — اضغط «تجهيز نشر».</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
