"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createComplianceReview, type ReviewState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconCheck } from "@/components/icons";

const initial: ReviewState = {};

export default function NewReview({ items }: { items: { id: string; question: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createComplianceReview, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconCheck /> مراجعة امتثال</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(560px,100%)", maxHeight: "88vh", overflowY: "auto" }}>
            <div className="card-head"><h3>مراجعة امتثال جديدة</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field">
                <label>المحتوى المُراجَع</label>
                <input className="inp" name="subject" placeholder="مثال: تجربة منتج الترطيب (إعلان)" required minLength={3} />
              </div>
              {items.map((it) => (
                <div className="row between" key={it.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 10 }}>
                  <span style={{ fontSize: 13 }}>{it.question}</span>
                  <select className="sel" name={`item_${it.id}`} defaultValue="yes" style={{ width: 120 }}>
                    <option value="yes">نعم</option>
                    <option value="no">لا</option>
                    <option value="na">لا ينطبق</option>
                  </select>
                </div>
              ))}
              <div className="field" style={{ marginTop: 14 }}>
                <label>ملاحظات</label>
                <input className="inp" name="notes" placeholder="ملاحظات امتثال (اختياري)" />
              </div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الحفظ…">حفظ المراجعة</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
