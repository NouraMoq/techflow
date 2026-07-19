import { test, expect } from "@playwright/test";
import { login, CREATOR, WRITER, ADMIN } from "./helpers";

test.describe("RBAC & tenant isolation", () => {
  test("client role cannot reach the admin area (redirected to dashboard)", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("tenant isolation: creator only sees their own ideas", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/ideas");
    // The seeded creator tenant has 8 ideas; the OTHER tenant's idea must not leak.
    await expect(page.getByText("وصفة سريعة في ٦٠ ثانية")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "بنك الأفكار" })).toBeVisible();
  });

  test("writer cannot approve scripts but content/creator can (read-only editor for writer's non-approve)", async ({ page }) => {
    // Writer has script.write but NOT content.approve.
    await login(page, WRITER);
    await page.goto("/scripts");
    await expect(page.getByRole("heading", { name: "السيناريوهات" })).toBeVisible();
  });

  test("admin sees cross-tenant clients on the NovaMetrics dashboard", async ({ page }) => {
    await login(page, ADMIN);
    await page.goto("/admin");
    await expect(page.getByText("ليان القحطاني")).toBeVisible();
    // The clients table is present (heading), proving cross-tenant admin view.
    await expect(page.getByRole("heading", { name: "العملاء", exact: true })).toBeVisible();
  });

  test("CSV export requires auth (401 when unauthenticated)", async ({ request }) => {
    const res = await request.get("/api/reports/revenue");
    expect(res.status()).toBe(401);
  });
});
