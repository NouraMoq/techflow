"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createTrend, type TrendState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: TrendState = {};

export default function NewTrend() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createTrend, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> إضافة ترند</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(480px,100%)" }}>
            <div className="card-head"><h3>إضافة ترند (إدخال يدوي)</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>اسم الترند</label>
                <input className="inp" name="name" placeholder="مثال: انتقالات المرآة" required minLength={2} /></div>
              <div className="grid g-2">
                <div className="field"><label>النوع</label>
                  <select className="sel" name="type" defaultValue="format">
                    <option value="sound">صوت</option>
                    <option value="effect">تأثير بصري</option>
                    <option value="challenge">تحدٍّ</option>
                    <option value="format">صيغة</option>
                  </select></div>
                <div className="field"><label>درجة النمو (٠-١٠٠)</label>
                  <input className="inp" name="growthScore" type="number" min={0} max={100} placeholder="70" /></div>
              </div>
              <div className="field"><label>الهاشتاق</label>
                <input className="inp" name="hashtag" placeholder="#trend" /></div>
              <div className="field"><label>الزاوية المقترحة</label>
                <input className="inp" name="angle" placeholder="زاوية تناسب صانع المحتوى" /></div>
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
