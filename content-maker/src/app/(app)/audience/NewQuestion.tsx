"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createQuestion, type AudienceState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: AudienceState = {};

export default function NewQuestion() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createQuestion, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> سؤال جديد</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(460px,100%)" }}>
            <div className="card-head"><h3>سؤال جمهور (إدخال يدوي)</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>نص السؤال</label>
                <input className="inp" name="text" placeholder="مثال: ما أفضل روتين للبشرة الجافة؟" required minLength={3} /></div>
              <div className="grid g-2">
                <div className="field"><label>التصنيف</label>
                  <select className="sel" name="category" defaultValue="faq">
                    <option value="faq">سؤال متكرر</option>
                    <option value="content_opportunity">فرصة محتوى</option>
                    <option value="potential_ad">إعلان محتمل</option>
                    <option value="escalation">تصعيد</option>
                  </select></div>
                <div className="field"><label>عدد التكرار</label>
                  <input className="inp" name="count" type="number" min={1} placeholder="1" /></div>
              </div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الحفظ…">إضافة</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
