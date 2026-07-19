"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconHome, IconTarget, IconColumns, IconBulb, IconWorkflow, IconTasks,
  IconCheck, IconChart, IconUsers, IconGrid, IconMoney, IconShield,
  IconHandshake, IconDoc, IconFolder, IconAlert, IconRocket, IconPlug,
  IconCamera, IconRadar, IconScript, IconCalendar, IconChat, IconSparkles, IconEye,
} from "./icons";

type Item = { href: string; label: string; Icon: (p: { className?: string }) => JSX.Element; pill?: string };
type Group = { group: string; items: Item[] };

const CLIENT_NAV: Group[] = [
  { group: "الرئيسية", items: [
    { href: "/dashboard", label: "الرئيسية", Icon: IconHome },
    { href: "/portal", label: "بوابة المشهور", Icon: IconEye },
  ] },
  { group: "الاستراتيجية والمحتوى", items: [
    { href: "/strategy", label: "الهوية والاستراتيجية", Icon: IconTarget },
    { href: "/pillars", label: "أعمدة المحتوى", Icon: IconColumns },
    { href: "/ideas", label: "بنك الأفكار", Icon: IconBulb },
    { href: "/trends", label: "رادار الترندات", Icon: IconRadar },
    { href: "/scripts", label: "السيناريوهات", Icon: IconScript },
  ] },
  { group: "الإنتاج", items: [
    { href: "/production", label: "المحتوى والإنتاج", Icon: IconWorkflow },
    { href: "/shoots", label: "جلسات التصوير", Icon: IconCamera },
    { href: "/calendar", label: "التقويم التحريري", Icon: IconCalendar },
    { href: "/tasks", label: "المهام", Icon: IconTasks },
    { href: "/approvals", label: "الموافقات", Icon: IconCheck },
    { href: "/assets", label: "مكتبة الملفات", Icon: IconFolder },
    { href: "/publishing", label: "النشر على TikTok", Icon: IconRocket },
  ] },
  { group: "التجارة", items: [
    { href: "/campaigns", label: "الحملات والإعلانات", Icon: IconHandshake },
    { href: "/contracts", label: "العقود والفواتير", Icon: IconDoc },
  ] },
  { group: "الحوكمة", items: [
    { href: "/compliance", label: "الامتثال", Icon: IconShield },
    { href: "/crisis", label: "السمعة والأزمات", Icon: IconAlert },
  ] },
  { group: "الأداء والفريق", items: [
    { href: "/analytics", label: "التحليلات", Icon: IconChart },
    { href: "/recommendations", label: "التوصيات الذكية", Icon: IconSparkles },
    { href: "/audience", label: "الجمهور والأسئلة", Icon: IconChat },
    { href: "/reports", label: "التقارير", Icon: IconDoc },
    { href: "/integrations", label: "التكاملات", Icon: IconPlug },
    { href: "/team", label: "الفريق والصلاحيات", Icon: IconUsers },
  ] },
];

const ADMIN_NAV: Group[] = [
  { group: "نوفاميتريكس", items: [
    { href: "/admin", label: "لوحة الإدارة", Icon: IconGrid },
    { href: "/admin/plans", label: "الباقات", Icon: IconMoney },
    { href: "/admin/compliance", label: "إعدادات الامتثال", Icon: IconShield },
    { href: "/admin/audit", label: "سجل التدقيق", Icon: IconCheck },
  ] },
];

export default function Sidebar({ scope }: { scope: string }) {
  const pathname = usePathname();
  const nav = scope === "admin" ? ADMIN_NAV : CLIENT_NAV;
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">ص</div>
        <div><b>صانع المحتوى</b><span>نوفاميتريكس</span></div>
      </div>
      <nav className="nav">
        {nav.map((g) => (
          <div key={g.group}>
            <div className="nav-label">{g.group}</div>
            {g.items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link key={it.href} href={it.href} className={`nav-item${active ? " active" : ""}`}>
                  <it.Icon />
                  <span>{it.label}</span>
                  {it.pill && <span className="pill">{it.pill}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
