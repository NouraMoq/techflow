"use client";
import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { captureIdea, type CaptureState } from "./actions";
import SubmitButton from "@/components/SubmitButton";

const initial: CaptureState = {};

export default function QuickIdea() {
  const [state, formAction] = useFormState(captureIdea, initial);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state.ok]);

  return (
    <form action={formAction} ref={ref}>
      {state.error && <div className="err">{state.error}</div>}
      {state.ok && <div style={{ background: "var(--green-tint)", color: "var(--green)", padding: "8px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>تم حفظ فكرتك في بنك الأفكار ✓</div>}
      <textarea className="ta" name="title" placeholder="اكتب فكرتك هنا… (أو سجّلها لاحقًا صوتيًا)" required minLength={3} style={{ minHeight: 80, marginBottom: 10 }} />
      <SubmitButton className="btn btn-primary p-btn-lg" pendingLabel="جارٍ الحفظ…">إرسال الفكرة</SubmitButton>
    </form>
  );
}
