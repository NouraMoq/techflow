import { requireSession } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  if (isAdminRole(s.role)) redirect("/admin");
  return (
    <div className="shell">
      <Sidebar scope="client" />
      <div className="main">
        <Topbar name={s.name} role={s.role} crumb="لوحة العميل" />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
