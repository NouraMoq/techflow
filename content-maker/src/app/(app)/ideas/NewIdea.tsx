"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createIdea, type NewIdeaState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: NewIdeaState = {};

export default function NewIdea({ pillars }: { pillars: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createIdea, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) { setOpen(false); ref.current?.reset(); }
  }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <IconPlus /> فكرة جديدة
      </button>
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}
        >
          <div className="card" style={{ width: "min(480px,100%)" }}>
            <div className="card-head"><h3>فكرة جديدة</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field">
                <label>عنوان الفكرة</label>
                <input className="inp" name="title" placeholder="مثال: ٥ نصائح سريعة للعناية" required minLength={3} />
              </div>
              <div className="field">
                <label>عمود المحتوى</label>
                <select className="sel" name="pillarId" defaultValue="none">
                  <option value="none">بدون</option>
                  {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label>الأولوية</label>
                <select className="sel" name="priority" defaultValue="medium">
                  <option value="high">عالية</option>
                  <option value="medium">متوسطة</option>
                  <option value="low">منخفضة</option>
                </select>
              </div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الحفظ…">إضافة الفكرة</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
