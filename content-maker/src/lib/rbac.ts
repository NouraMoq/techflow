// ============================================================================
// Role-Based Access Control. Roles map to a set of permissions.
// Permissions are checked with can(role, permission). Kept in sync with
// docs/user-roles-and-permissions-ar.md.
// ============================================================================

export type Permission =
  | "idea.create" | "idea.edit" | "idea.delete"
  | "script.write"
  | "content.approve" | "content.reject" | "content.schedule" | "content.publish"
  | "analytics.view"
  | "team.manage"
  | "finance.view" | "contracts.view"
  | "files.upload"
  | "report.export"
  | "compliance.review"
  | "crisis.manage"
  | "shoot.manage"
  | "trend.manage"
  | "audience.manage"
  | "recommendation.manage"
  | "admin.access";

export type RoleKey =
  | "creator" | "biz" | "content" | "writer" | "editor" | "designer"
  | "analyst" | "ads" | "reviewer" | "viewer"
  | "nova_admin" | "nova_am" | "nova_support" | "nova_billing" | "nova_compliance";

export const ROLE_LABELS: Record<RoleKey, string> = {
  creator: "المشهور / صانع المحتوى",
  biz: "مدير الأعمال",
  content: "مدير المحتوى",
  writer: "كاتب المحتوى",
  editor: "المونتير",
  designer: "المصمم",
  analyst: "محلل البيانات",
  ads: "مسؤول الإعلانات والشراكات",
  reviewer: "المراجع / المعتمد النهائي",
  viewer: "عرض فقط",
  nova_admin: "نوفاميتريكس — Super Admin",
  nova_am: "نوفاميتريكس — مدير حساب",
  nova_support: "نوفاميتريكس — الدعم الفني",
  nova_billing: "نوفاميتريكس — الفوترة",
  nova_compliance: "نوفاميتريكس — الامتثال",
};

const ALL: Permission[] = [
  "idea.create", "idea.edit", "idea.delete", "script.write",
  "content.approve", "content.reject", "content.schedule", "content.publish",
  "analytics.view", "team.manage", "finance.view", "contracts.view",
  "files.upload", "report.export", "compliance.review", "crisis.manage",
  "shoot.manage", "trend.manage", "audience.manage", "recommendation.manage", "admin.access",
];

const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  creator: ["idea.create", "idea.edit", "content.approve", "content.reject", "content.schedule",
    "content.publish", "analytics.view", "team.manage", "finance.view", "contracts.view",
    "files.upload", "report.export", "compliance.review", "crisis.manage", "shoot.manage", "trend.manage",
    "audience.manage", "recommendation.manage"],
  biz: ["idea.create", "content.approve", "analytics.view", "finance.view", "contracts.view",
    "files.upload", "report.export", "compliance.review", "crisis.manage", "shoot.manage",
    "audience.manage", "recommendation.manage"],
  content: ["idea.create", "idea.edit", "idea.delete", "script.write", "content.approve",
    "content.reject", "content.schedule", "content.publish", "analytics.view", "team.manage",
    "files.upload", "report.export", "compliance.review", "crisis.manage", "shoot.manage", "trend.manage",
    "audience.manage", "recommendation.manage"],
  writer: ["idea.create", "idea.edit", "script.write", "analytics.view", "files.upload", "trend.manage", "audience.manage"],
  editor: ["files.upload", "analytics.view", "shoot.manage"],
  designer: ["files.upload"],
  analyst: ["analytics.view", "report.export", "trend.manage", "recommendation.manage"],
  ads: ["contracts.view", "analytics.view", "files.upload", "report.export"],
  reviewer: ["content.approve", "content.reject", "analytics.view", "compliance.review"],
  viewer: ["analytics.view"],
  nova_admin: ALL,
  nova_am: ["idea.create", "idea.edit", "content.approve", "analytics.view", "contracts.view",
    "report.export", "files.upload", "admin.access"],
  nova_support: ["admin.access", "analytics.view"],
  nova_billing: ["admin.access", "finance.view", "report.export"],
  nova_compliance: ["admin.access", "contracts.view", "report.export", "compliance.review", "crisis.manage"],
};

export function can(role: string, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role as RoleKey];
  return !!perms && perms.includes(permission);
}

export function isAdminRole(role: string): boolean {
  return role.startsWith("nova_");
}

export function permissionsFor(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as RoleKey] ?? [];
}
