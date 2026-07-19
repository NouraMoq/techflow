import { test, expect } from "@playwright/test";
import { login, CREATOR, ADMIN } from "./helpers";

test.describe("Auth & session", () => {
  test("unauthenticated visit redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("creator can log in and lands on the dashboard", async ({ page }) => {
    await login(page, CREATOR);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator("h1")).toContainText("مرحبًا");
  });

  test("admin logs in and lands on the NovaMetrics dashboard", async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("h1")).toContainText("نوفاميتريكس");
  });

  test("invalid password is rejected", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', CREATOR);
    await page.fill('input[type="password"]', "wrong-password");
    await page.click('button:has-text("تسجيل الدخول")');
    await expect(page.locator(".err")).toContainText("غير صحيحة");
  });
});
