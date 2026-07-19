"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createShootSession, type ShootState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: ShootState = {};

export default function NewShoot() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createShootSession, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> جلسة تصوير</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(480px,100%)" }}>
            <div className="card-head"><h3>جلسة تصوير جديدة</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>اسم الجلسة</label>
                <input className="inp" name="name" placeholder="مثال: يوم تصوير سلسلة العناية" required minLength={3} /></div>
              <div className="field"><label>الموقع</label>
                <input className="inp" name="location" placeholder="استوديو / منزل / موقع خارجي" /></div>
              <div className="grid g-2">
                <div className="field"><label>التاريخ والوقت</label>
                  <input className="inp" name="date" type="datetime-local" /></div>
                <div className="field"><label>التكلفة (ر.س)</label>
                  <input className="inp" name="cost" type="number" min={0} placeholder="مثال: 3000" /></div>
              </div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الحفظ…">إنشاء الجلسة</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
