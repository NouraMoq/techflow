"use client";
import { useFormState } from "react-dom";
import { loginAction, type LoginState } from "@/lib/auth-actions";
import SubmitButton from "@/components/SubmitButton";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);
  return (
    <form action={formAction}>
      {state.error && <div className="err">{state.error}</div>}
      <div className="field">
        <label>البريد الإلكتروني</label>
        <input className="inp" type="email" name="email" defaultValue="creator@example.sa" required />
      </div>
      <div className="field">
        <label>كلمة المرور</label>
        <input className="inp" type="password" name="password" defaultValue="password123" required />
      </div>
      <SubmitButton style={{ width: "100%" }} pendingLabel="جارٍ الدخول…">تسجيل الدخول</SubmitButton>
    </form>
  );
}
