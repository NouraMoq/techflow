import { type Page, expect } from "@playwright/test";

export async function login(page: Page, email: string, password = "password123") {
  await page.goto("/login");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([
    page.waitForURL(/\/(dashboard|admin)/),
    page.click('button:has-text("تسجيل الدخول")'),
  ]);
}

export async function logout(page: Page) {
  await Promise.all([
    page.waitForURL(/\/login/),
    page.click('button[title="تسجيل الخروج"], button[title="خروج"]'),
  ]);
}

export const CREATOR = "creator@example.sa";
export const CONTENT = "content@example.sa";
export const WRITER = "writer@example.sa";
export const ADMIN = "admin@novametrics.sa";

export { expect };
