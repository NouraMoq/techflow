"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { createSession, destroySession } from "./session";
import { isAdminRole } from "./rbac";

const loginSchema = z.object({
  email: z.string().email("بريد غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!user || !user.memberships.length) {
    return { error: "البريد أو كلمة المرور غير صحيحة" };
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { error: "البريد أو كلمة المرور غير صحيحة" };

  // Pick the membership (a real app would let the user choose a tenant).
  const m = user.memberships[0];
  await createSession({
    uid: user.id,
    tid: m.tenantId,
    role: m.role,
    scope: m.scope,
    name: user.name,
  });

  await prisma.auditLog.create({
    data: { tenantId: m.tenantId, userId: user.id, action: "auth.login", entity: "User", entityId: user.id },
  });

  redirect(isAdminRole(m.role) ? "/admin" : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
