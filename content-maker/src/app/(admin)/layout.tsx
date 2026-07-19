import { requireAdmin } from "@/lib/session";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await requireAdmin();
  return (
    <div className="shell">
      <Sidebar scope="admin" />
      <div className="main">
        <Topbar name={s.name} role={s.role} crumb="لوحة نوفاميتريكس" />
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
