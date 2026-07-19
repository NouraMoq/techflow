import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { QUESTION_CATEGORY, QUESTION_STATUS } from "@/lib/community";
import { IconShield } from "@/components/icons";
import NewQuestion from "./NewQuestion";
import { setQuestionStatus, convertToIdea, addListItem } from "./actions";

export default async function AudiencePage() {
  const s = await requireSession();
  const [questions, responses, sensitive] = await Promise.all([
    prisma.audienceQuestion.findMany({ where: { tenantId: s.tid, deletedAt: null }, orderBy: { count: "desc" } }),
    prisma.audienceListItem.findMany({ where: { tenantId: s.tid, kind: "response" } }),
    prisma.audienceListItem.findMany({ where: { tenantId: s.tid, kind: "sensitive" } }),
  ]);
  const mayManage = can(s.role, "audience.manage");

  return (
    <>
      <div className="page-head">
        <div><h1>الجمهور والأسئلة</h1><p>إدارة التفاعل دون أي جمع غير مصرّح — إدخال يدوي أو تكامل رسمي لاحقًا.</p></div>
        <div className="actions">{mayManage && <NewQuestion />}</div>
      </div>

      <div className="callout info" style={{ marginBottom: 16 }}>
        <IconShield /><div><b>التزام</b><p>لا Scraping ولا جمع غير مصرّح للتعليقات. المصادر الرسمية تُضاف مستقبلًا عبر طبقة التكامل.</p></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>أكثر الأسئلة تكرارًا</h3><span className="sub">{questions.length} سؤال · فرص محتوى محتملة</span></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>السؤال</th><th>التكرار</th><th>التصنيف</th><th>الحالة</th><th>إجراء</th></tr></thead>
            <tbody>
              {questions.map((q) => {
                const cat = QUESTION_CATEGORY[q.category] ?? QUESTION_CATEGORY.faq;
                const st = QUESTION_STATUS[q.status] ?? QUESTION_STATUS.new;
                return (
                  <tr key={q.id}>
                    <td><b>{q.text}</b></td>
                    <td className="faint">{q.count} مرة</td>
                    <td><span className={`badge ${cat.cls}`}>{cat.label}</span></td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td>
                      {mayManage && q.status !== "converted" && (
                        <div className="row" style={{ gap: 6 }}>
                          {can(s.role, "idea.create") && (
                            <form action={convertToIdea}>
                              <input type="hidden" name="id" value={q.id} />
                              <button className="btn btn-soft" style={{ fontSize: 11.5, padding: "4px 9px" }}>حوّل لفكرة</button>
                            </form>
                          )}
                          {q.status === "new" && (
                            <form action={setQuestionStatus}>
                              <input type="hidden" name="id" value={q.id} />
                              <input type="hidden" name="status" value="answered" />
                              <button className="btn btn-ghost" style={{ fontSize: 11.5, padding: "4px 9px" }}>تمت الإجابة</button>
                            </form>
                          )}
                        </div>
                      )}
                      {q.status === "converted" && <span className="faint" style={{ fontSize: 11.5 }}>↳ فكرة</span>}
                    </td>
                  </tr>
                );
              })}
              {questions.length === 0 && <tr><td colSpan={5} className="faint" style={{ textAlign: "center", padding: 20 }}>لا أسئلة بعد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid g-2">
        <ListCard title="الردود المعتمدة" kind="response" items={responses.map((r) => r.text)} cls="on" mayManage={mayManage} ph="رد معتمد جديد" />
        <ListCard title="الكلمات الحساسة (تصعيد)" kind="sensitive" items={sensitive.map((r) => r.text)} cls="rose" mayManage={mayManage} ph="كلمة حساسة" />
      </div>
    </>
  );
}

function ListCard({ title, kind, items, cls, mayManage, ph }: { title: string; kind: string; items: string[]; cls: string; mayManage: boolean; ph: string }) {
  return (
    <div className="card">
      <div className="card-head"><h3>{title}</h3><span className="sub">{items.length}</span></div>
      <div className="card-pad">
        <div className="row wrap" style={{ gap: 7, marginBottom: 12 }}>
          {items.map((t, i) => (
            <span key={i} className="badge" style={cls === "rose"
              ? { background: "var(--rose-tint)", color: "var(--rose)" }
              : { background: "var(--primary-soft)", color: "var(--primary-ink)" }}>{t}</span>
          ))}
          {items.length === 0 && <span className="faint" style={{ fontSize: 12.5 }}>لا عناصر بعد</span>}
        </div>
        {mayManage && (
          <form action={addListItem} className="row" style={{ gap: 6 }}>
            <input type="hidden" name="kind" value={kind} />
            <input className="inp" name="text" placeholder={ph} required style={{ padding: "7px 11px", fontSize: 13 }} />
            <button className="btn btn-ghost" style={{ fontSize: 12.5 }}>إضافة</button>
          </form>
        )}
      </div>
    </div>
  );
}
