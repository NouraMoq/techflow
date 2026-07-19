"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { createPublishJob, type PublishActionState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: PublishActionState = {};

export default function NewPublish({ projects, disabled }: { projects: { id: string; title: string }[]; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createPublishJob, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { setOpen(false); ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)} disabled={disabled}
        title={disabled ? "اربط TikTok أولًا" : undefined} style={disabled ? { opacity: 0.5 } : undefined}>
        <IconPlus /> تجهيز نشر
      </button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(480px,100%)" }}>
            <div className="card-head"><h3>تجهيز نشر جديد</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              <div className="field"><label>المشروع (اختياري)</label>
                <select className="sel" name="projectId" defaultValue="none">
                  <option value="none">بدون ربط</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select></div>
              <div className="field"><label>الوصف والهاشتاقات</label>
                <textarea className="ta" name="caption" placeholder="اكتب وصف المنشور والهاشتاقات…" required minLength={3} style={{ minHeight: 90 }} /></div>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ التجهيز…">تجهيز</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
