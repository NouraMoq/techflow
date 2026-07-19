"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createCalendarItem, type CalState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: CalState = {};

export default function NewCalItem() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createCalendarItem, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> عنصر جديد</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(440px,100%)" }}>
            <div className="card-head"><h3>عنصر تقويم جديد</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>العنوان</label>
                <input className="inp" name="title" placeholder="مثال: نشر فيديو الأسبوع" required minLength={2} /></div>
              <div className="grid g-2">
                <div className="field"><label>التاريخ</label>
                  <input className="inp" name="date" type="date" required /></div>
                <div className="field"><label>النوع</label>
                  <select className="sel" name="type" defaultValue="publish">
                    <option value="publish">نشر</option>
                    <option value="shoot">تصوير</option>
                    <option value="approval">اعتماد</option>
                    <option value="campaign">حملة</option>
                    <option value="event">مناسبة</option>
                    <option value="no_publish">يوم عدم نشر</option>
                  </select></div>
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
