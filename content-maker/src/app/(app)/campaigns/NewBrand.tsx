"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createBrandOpportunity, type NewBrandState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: NewBrandState = {};

export default function NewBrand() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createBrandOpportunity, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> فرصة جديدة</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(460px,100%)" }}>
            <div className="card-head"><h3>فرصة تجارية جديدة</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>اسم العلامة التجارية</label>
                <input className="inp" name="name" placeholder="مثال: علامة عناية" required minLength={2} /></div>
              <div className="field"><label>القطاع</label>
                <input className="inp" name="sector" placeholder="عناية وجمال / تقنية / أغذية…" /></div>
              <div className="field"><label>القيمة التقديرية (ر.س)</label>
                <input className="inp" name="dealValue" type="number" min={0} placeholder="مثال: 30000" /></div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الحفظ…">إضافة الفرصة</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
