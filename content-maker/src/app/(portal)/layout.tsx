import Link from "next/link";
import { requireSession } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";
import { IconGrid, IconLogout } from "@/components/icons";

// A deliberately minimal shell — no sidebar. The celebrity should not deal with
// the full agency dashboard complexity.
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  if (isAdminRole(s.role)) redirect("/admin");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header className="portal-top">
        <div className="brand-logo" style={{ width: 34, height: 34, fontSize: 17 }}>ص</div>
        <div style={{ minWidth: 0 }}>
          <b style={{ display: "block", fontSize: 14, fontWeight: 800 }}>بوابة {s.name.split(" ")[0]}</b>
          <span style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600 }}>صانع المحتوى · نوفاميتريكس</span>
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", gap: 8 }}>
          <Link href="/dashboard" className="tb-btn" title="اللوحة الكاملة"><IconGrid /></Link>
          <form action={logoutAction}>
            <button className="tb-btn" title="خروج"><IconLogout /></button>
          </form>
        </div>
      </header>
      <main className="portal-wrap">{children}</main>
    </div>
  );
}
