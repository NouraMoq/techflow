import { logoutAction } from "@/lib/auth-actions";
import { ROLE_LABELS, type RoleKey } from "@/lib/rbac";
import { IconLogout } from "./icons";

export default function Topbar({ name, role, crumb }: { name: string; role: string; crumb: string }) {
  const roleLabel = ROLE_LABELS[role as RoleKey] ?? role;
  const initial = name.trim().charAt(0);
  return (
    <header className="topbar">
      <div className="crumbs">
        صانع المحتوى <span>/</span> <b>{crumb}</b>
      </div>
      <div style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <span className="badge b-slate" title="دورك الحالي">{roleLabel}</span>
        <form action={logoutAction}>
          <button className="tb-btn" title="تسجيل الخروج" aria-label="تسجيل الخروج"><IconLogout /></button>
        </form>
        <div className="avatar" title={name}>{initial}</div>
      </div>
    </header>
  );
}
