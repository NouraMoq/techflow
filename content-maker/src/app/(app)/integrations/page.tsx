import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseArr } from "@/lib/json";
import { PLATFORMS, isLiveConfigured } from "@/lib/integrations/registry";
import { INTEGRATION_STATUS, modeLabel } from "@/lib/integrations/labels";
import { dateAr } from "@/lib/commerce";
import { IconAlert, IconPlus } from "@/components/icons";
import { connectIntegration, setIntegrationStatus } from "./actions";

export default async function IntegrationsPage() {
  const s = await requireSession();
  const integrations = await prisma.integration.findMany({
    where: { tenantId: s.tid }, include: { connection: true },
  });
  const byProvider = new Map(integrations.map((i) => [i.provider, i]));
  const mayManage = can(s.role, "content.publish");
  const tiktokLive = isLiveConfigured("tiktok");

  return (
    <>
      <div className="page-head">
        <div><h1>التكاملات</h1><p>Integration Hub — يعمل عبر Adapter Pattern، مع مزوّد تجريبي (Mock) حتى تتوفر بيانات الاعتماد الرسمية.</p></div>
      </div>

      {!tiktokLive && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <IconAlert />
          <div>
            <b>الوضع التجريبي (Mock) مُفعّل</b>
            <p>لا توجد بيانات اعتماد TikTok رسمية بعد. الربط والنشر يعملان كمحاكاة لبناء المسار كاملًا — دون أي حساب حقيقي أو نشر آلي غير رسمي، ودون طلب كلمات مرور. التكامل المباشر يُفعَّل بعد تسجيل التطبيق والحصول على الموافقات.</p>
          </div>
        </div>
      )}

      <div className="grid g-3">
        {PLATFORMS.map((p) => {
          const it = byProvider.get(p.key);
          const status = it?.status ?? "disconnected";
          const meta = INTEGRATION_STATUS[status] ?? INTEGRATION_STATUS.disconnected;
          const scopes = parseArr(it?.connection?.scopesJson);
          return (
            <div className="card card-pad" key={p.key}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <b style={{ fontSize: 15 }}>{p.label}</b>
                <span className={`badge ${meta.cls}`}>{meta.label}</span>
              </div>
              {p.planned ? (
                <div className="faint" style={{ fontSize: 12.5 }}>مخطط — يُضاف عبر Adapter لاحقًا.</div>
              ) : (
                <>
                  <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
                    الوضع: {modeLabel(it?.mode ?? "mock")}
                    {it?.connection?.accountRef && <> · {it.connection.accountRef}</>}
                  </div>
                  {it?.connection?.expiresAt && (
                    <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>تنتهي الصلاحية: {dateAr(it.connection.expiresAt)}</div>
                  )}
                  {scopes.length > 0 && (
                    <div className="row wrap" style={{ gap: 4, marginBottom: 10 }}>
                      {scopes.map((sc) => <span key={sc} className="badge b-slate" style={{ fontSize: 10 }}>{sc}</span>)}
                    </div>
                  )}
                  {it?.note && <div className="callout info" style={{ padding: "8px 11px", marginBottom: 10 }}><IconAlert /><div><p style={{ fontSize: 12 }}>{it.note}</p></div></div>}

                  {mayManage && (
                    <div className="row wrap" style={{ gap: 6 }}>
                      {status !== "connected" ? (
                        <form action={connectIntegration}>
                          <input type="hidden" name="provider" value={p.key} />
                          <button className="btn btn-primary" style={{ fontSize: 12.5, padding: "6px 12px" }}><IconPlus /> ربط</button>
                        </form>
                      ) : (
                        <>
                          <form action={setIntegrationStatus}>
                            <input type="hidden" name="provider" value={p.key} />
                            <input type="hidden" name="status" value="needs_reauth" />
                            <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px" }}>إعادة تصريح</button>
                          </form>
                          <form action={setIntegrationStatus}>
                            <input type="hidden" name="provider" value={p.key} />
                            <input type="hidden" name="status" value="paused" />
                            <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "6px 12px" }}>إيقاف مؤقت</button>
                          </form>
                          <form action={setIntegrationStatus}>
                            <input type="hidden" name="provider" value={p.key} />
                            <input type="hidden" name="status" value="disconnected" />
                            <button className="btn btn-danger" style={{ fontSize: 12.5, padding: "6px 12px" }}>فصل</button>
                          </form>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
