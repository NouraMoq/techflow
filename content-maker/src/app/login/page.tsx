import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect(isAdminRole(s.role) ? "/admin" : "/dashboard");

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ border: "none", padding: "0 0 18px" }}>
          <div className="brand-logo">ص</div>
          <div>
            <b>صانع المحتوى</b>
            <span>نوفاميتريكس · من الفكرة إلى التأثير</span>
          </div>
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 4px" }}>أهلًا بعودتك</h1>
        <p className="muted" style={{ fontSize: 13.5, margin: "0 0 20px" }}>
          سجّل الدخول لإدارة محتواك وفريقك.
        </p>
        <LoginForm />
        <div className="divider" />
        <p className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>
          حسابات تجريبية:<br />
          <b>creator@example.sa</b> (عميل) · <b>admin@novametrics.sa</b> (إدارة)<br />
          كلمة المرور: <b>password123</b>
        </p>
      </div>
    </div>
  );
}
