import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";

export default async function Home() {
  const s = await getSession();
  if (!s) redirect("/login");
  redirect(isAdminRole(s.role) ? "/admin" : "/dashboard");
}
