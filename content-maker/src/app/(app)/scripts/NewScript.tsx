"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { createScript, type ScriptState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: ScriptState = {};

export default function NewScript({ ideas }: { ideas: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createScript, initial);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> سيناريو جديد</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(460px,100%)" }}>
            <div className="card-head"><h3>سيناريو جديد</h3></div>
            <form action={formAction} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>عنوان السيناريو</label>
                <input className="inp" name="title" placeholder="مثال: تجربة منتج — سيناريو" required minLength={3} /></div>
              <div className="field"><label>ربط بفكرة (اختياري)</label>
                <select className="sel" name="ideaId" defaultValue="none">
                  <option value="none">بدون ربط</option>
                  {ideas.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
                </select></div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الإنشاء…">إنشاء وفتح المحرر</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
