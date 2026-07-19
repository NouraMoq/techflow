import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { parseArr } from "@/lib/json";
import { can } from "@/lib/rbac";
import { ASSET_TYPE_LABEL, dateAr } from "@/lib/commerce";
import { storageMode } from "@/lib/storage/registry";
import { IconAlert, IconFolder } from "@/components/icons";
import UploadAsset from "./UploadAsset";
import { deleteAsset } from "./actions";

// Rights-expiry alert window (days).
const SOON_DAYS = 45;

export default async function AssetsPage() {
  const s = await requireSession();
  const assets = await prisma.asset.findMany({
    where: { tenantId: s.tid, deletedAt: null },
    include: { _count: { select: { versions: true } } },
    orderBy: { createdAt: "desc" },
  });

  const folders = Array.from(new Set(assets.map((a) => a.folder)));
  const mayUpload = can(s.role, "files.upload");
  const mode = storageMode();
  const now = new Date();
  const expiring = assets.filter(
    (a) => a.rightsExpiry && (new Date(a.rightsExpiry).getTime() - now.getTime()) / 86400000 < SOON_DAYS
  );

  return (
    <>
      <div className="page-head">
        <div><h1>مكتبة الملفات</h1><p>مكتبة أصول رقمية — رفع فعلي، إصدارات، مجلدات، وتنبيه انتهاء الحقوق. لا تُخزَّن مفاتيح أو روابط سرية في الواجهة.</p></div>
        <div className="actions">{mayUpload && <UploadAsset folders={folders} />}</div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconFolder />
        <div>
          <b>وضع التخزين: {mode === "s3" ? "S3 (مباشر)" : "محلي (Local)"}</b>
          <p>{mode === "s3"
            ? "الملفات تُخزَّن في S3 والتحميل عبر روابط موقّعة مؤقتة (Presigned)."
            : "لا مفاتيح S3 مهيّأة — التخزين محلي على القرص مع روابط موقّعة مؤقتة (مطابق لعقد S3). فعّل S3 بضبط متغيّرات البيئة."}</p>
        </div>
      </div>

      {expiring.length > 0 && (
        <div className="callout warn" style={{ marginBottom: 16 }}>
          <IconAlert />
          <div>
            <b>حقوق على وشك الانتهاء</b>
            <p>{expiring.map((a) => `${a.name} (${dateAr(a.rightsExpiry)})`).join(" · ")}</p>
          </div>
        </div>
      )}

      <div className="row wrap" style={{ gap: 8, marginBottom: 16 }}>
        <span className="badge b-primary">الكل ({assets.length})</span>
        {folders.map((f) => (
          <span className="badge b-slate" key={f}>{f} ({assets.filter((a) => a.folder === f).length})</span>
        ))}
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>الملف</th><th>النوع</th><th>المجلد</th><th>الحجم</th><th>المالك</th><th>الحقوق</th><th>إجراء</th></tr></thead>
            <tbody>
              {assets.map((a) => {
                const tags = parseArr(a.tagsJson);
                return (
                  <tr key={a.id}>
                    <td>
                      {a.uploaded
                        ? <a href={`/api/storage/asset/${a.id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: "var(--primary-ink)" }}>{a.name}</a>
                        : <b>{a.name}</b>}
                      {a.uploaded && <span className="badge b-green" style={{ fontSize: 9, marginInlineStart: 6 }}>مرفوع</span>}
                      {tags.length > 0 && (
                        <div className="row wrap" style={{ gap: 4, marginTop: 4 }}>
                          {tags.map((t) => <span key={t} className="badge b-slate" style={{ fontSize: 10 }}>#{t}</span>)}
                        </div>
                      )}
                    </td>
                    <td>{ASSET_TYPE_LABEL[a.type] ?? a.type}</td>
                    <td>{a.folder}</td>
                    <td>{a.sizeLabel ?? "—"}</td>
                    <td>{a.ownerName ?? "—"}</td>
                    <td>{a.rightsExpiry ? <span className="badge b-amber">ينتهي {dateAr(a.rightsExpiry)}</span> : <span className="faint">—</span>}</td>
                    <td>
                      {a.uploaded ? (
                        <div className="row" style={{ gap: 6 }}>
                          <a href={`/api/storage/asset/${a.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 11.5, padding: "4px 9px" }}>تنزيل</a>
                          {mayUpload && (
                            <form action={deleteAsset}>
                              <input type="hidden" name="id" value={a.id} />
                              <button className="btn btn-danger" style={{ fontSize: 11.5, padding: "4px 9px" }}>حذف</button>
                            </form>
                          )}
                        </div>
                      ) : <span className="faint" style={{ fontSize: 11.5 }}>بيانات فقط</span>}
                    </td>
                  </tr>
                );
              })}
              {assets.length === 0 && <tr><td colSpan={7} className="faint" style={{ textAlign: "center", padding: 24 }}>لا ملفات بعد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
