import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { parseArr } from "@/lib/json";
import { SCRIPT_STATUS } from "@/lib/editorial";
import { dateAr } from "@/lib/commerce";
import { IconAlert, IconEye } from "@/components/icons";
import { saveScript, createScriptVersion, setScriptStatus } from "../actions";

export default async function ScriptEditor({ params }: { params: { id: string } }) {
  const s = await requireSession();
  const script = await prisma.script.findFirst({
    where: { id: params.id, tenantId: s.tid, deletedAt: null },
    include: { idea: true, versions: { orderBy: { version: "desc" } } },
  });
  if (!script) notFound();

  const mayWrite = can(s.role, "script.write");
  const mayApprove = can(s.role, "content.approve");
  const st = SCRIPT_STATUS[script.status] ?? SCRIPT_STATUS.draft;
  const hashtags = parseArr(script.hashtagsJson).join("، ");
  const ro = !mayWrite; // read-only for non-writers

  const field = (label: string, name: string, value: string | null, textarea = false, ph = "") =>
    textarea
      ? <div className="field"><label>{label}</label><textarea className="ta" name={name} defaultValue={value ?? ""} placeholder={ph} disabled={ro} /></div>
      : <div className="field"><label>{label}</label><input className="inp" name={name} defaultValue={value ?? ""} placeholder={ph} disabled={ro} /></div>;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="row" style={{ gap: 10 }}>
            <Link href="/scripts" className="faint" style={{ fontSize: 13 }}>← السيناريوهات</Link>
            <span className={`badge ${st.cls}`}>{st.label}</span>
            <span className="badge b-slate">v{script.version}</span>
          </div>
          <h1 style={{ marginTop: 6 }}>{script.title}</h1>
          {script.idea && <p>مرتبط بفكرة: {script.idea.title}</p>}
        </div>
        <div className="actions">
          <Link href={`/scripts/${script.id}/teleprompter`} className="btn btn-ghost"><IconEye /> Teleprompter</Link>
        </div>
      </div>

      <div className="grid g-12">
        {/* Editor form */}
        <div className="card">
          <form action={saveScript}>
            <input type="hidden" name="id" value={script.id} />
            <div className="card-pad">
              {field("العنوان الداخلي", "title", script.title)}
              {field("Hook (أول ٣ ثوانٍ)", "hook", script.hook, true, "افتتاحية تجذب الانتباه")}
              {field("المقدمة", "intro", script.intro, true)}
              {field("جسم المحتوى / نقاط الحديث", "body", script.body, true)}
              {field("CTA", "cta", script.cta, true)}
              {field("النص الظاهر على الشاشة", "onScreenText", script.onScreenText)}
              {field("وصف المنشور", "description", script.description, true)}
              {field("الهاشتاقات (مفصولة بفاصلة)", "hashtags", hashtags, false, "عناية، بشرة")}
              <div className="grid g-2">
                {field("الموسيقى", "music", script.music)}
                {field("المدة الكلية", "totalDuration", script.totalDuration)}
                {field("الملابس", "wardrobe", script.wardrobe)}
                {field("الموقع", "location", script.location)}
              </div>
              {field("ملاحظات", "notes", script.notes, true)}
              <label className="row" style={{ gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                <input type="checkbox" name="disclosure" defaultChecked={script.disclosure} disabled={ro} /> يحتوي إعلانًا (إفصاح إعلاني مطلوب)
              </label>
              {script.disclosure && (
                <div className="callout warn" style={{ marginBottom: 14 }}>
                  <IconAlert /><div><b>إفصاح إعلاني</b><p>يجب إظهار الإفصاح على الشاشة وفي الوصف — يخضع لمراجعة الامتثال.</p></div>
                </div>
              )}
              {mayWrite && (
                <div className="row" style={{ gap: 9 }}>
                  <button className="btn btn-primary">حفظ</button>
                </div>
              )}
              {!mayWrite && <div className="faint" style={{ fontSize: 12.5 }}>عرض فقط — لا تملك صلاحية التحرير.</div>}
            </div>
          </form>
        </div>

        {/* Side: workflow + versions */}
        <div>
          <div className="card">
            <div className="card-head"><h3>سير المراجعة</h3></div>
            <div className="card-pad">
              <div className="row wrap" style={{ gap: 8 }}>
                {mayWrite && script.status !== "review" && (
                  <StatusBtn id={script.id} status="review" label="إرسال للمراجعة" cls="btn-soft" />
                )}
                {mayApprove && script.status === "review" && (
                  <>
                    <StatusBtn id={script.id} status="approved" label="اعتماد" cls="btn-primary" />
                    <StatusBtn id={script.id} status="changes_requested" label="طلب تعديل" cls="btn-ghost" />
                  </>
                )}
                {mayWrite && (
                  <form action={createScriptVersion}>
                    <input type="hidden" name="id" value={script.id} />
                    <button className="btn btn-ghost" style={{ fontSize: 12.5 }}>حفظ كإصدار جديد</button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-head"><h3>سجل الإصدارات</h3><span className="sub">{script.versions.length} إصدار</span></div>
            <div className="card-pad" style={{ paddingTop: 6 }}>
              {script.versions.map((v) => (
                <div key={v.id} className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <b style={{ fontSize: 13 }}>v{v.version}</b>
                  <span className="faint" style={{ fontSize: 12 }}>{dateAr(v.createdAt)}</span>
                </div>
              ))}
              {script.versions.length === 0 && <div className="faint" style={{ fontSize: 12.5 }}>لا إصدارات محفوظة بعد.</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBtn({ id, status, label, cls }: { id: string; status: string; label: string; cls: string }) {
  return (
    <form action={setScriptStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`btn ${cls}`} style={{ fontSize: 12.5 }}>{label}</button>
    </form>
  );
}
