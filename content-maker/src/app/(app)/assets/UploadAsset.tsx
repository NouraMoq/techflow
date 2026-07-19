"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { uploadAsset, type UploadState } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { IconPlus } from "@/components/icons";

const initial: UploadState = {};

export default function UploadAsset({ folders }: { folders: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(uploadAsset, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) { ref.current?.reset(); } }, [state.ok]);

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}><IconPlus /> رفع ملف</button>
      {open && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(9,14,24,.5)", display: "grid", placeItems: "center", zIndex: 80, padding: 20 }}>
          <div className="card" style={{ width: "min(460px,100%)" }}>
            <div className="card-head"><h3>رفع ملف</h3></div>
            <form action={formAction} ref={ref} className="card-pad">
              {state.error && <div className="err">{state.error}</div>}
              {state.ok && <div style={{ background: "var(--green-tint)", color: "var(--green)", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>تم رفع «{state.name}» ✓</div>}
              <div className="field"><label>الملف</label>
                <input className="inp" type="file" name="file" required style={{ padding: 8 }} /></div>
              <div className="field"><label>المجلد</label>
                <input className="inp" name="folder" list="folders" placeholder="عام" defaultValue="عام" />
                <datalist id="folders">{folders.map((f) => <option key={f} value={f} />)}</datalist>
              </div>
              <p className="hint" style={{ fontSize: 11.5, color: "var(--faint)", marginBottom: 12 }}>
                الحد الأقصى ٥٠MB · صور/فيديو/صوت/PDF. يُخزَّن عبر مزوّد التخزين (S3 عند توفّره، وإلا محليًا).
              </p>
              <div className="row" style={{ justifyContent: "flex-start", gap: 9 }}>
                <SubmitButton pendingLabel="جارٍ الرفع…">رفع</SubmitButton>
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>إغلاق</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
