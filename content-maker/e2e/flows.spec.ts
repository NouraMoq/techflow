import { test, expect } from "@playwright/test";
import { login, CREATOR } from "./helpers";

test.describe("Core user flows", () => {
  test("create an idea end-to-end (server action writes to DB)", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/ideas");
    await page.click('button:has-text("فكرة جديدة")');
    const title = "فكرة E2E: اختبار تلقائي " + Date.now();
    await page.fill('input[name="title"]', title);
    await page.click('button:has-text("إضافة الفكرة")');
    // New idea appears in the kanban (draft column).
    await expect(page.getByText(title)).toBeVisible();
  });

  test("approve a pending item from the approvals page", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/approvals");
    const approveButtons = page.getByRole("button", { name: "اعتماد" });
    const before = await approveButtons.count();
    expect(before).toBeGreaterThan(0);
    await approveButtons.first().click();
    // After approval that card's approve button is gone → fewer approve buttons.
    await expect(async () => {
      expect(await page.getByRole("button", { name: "اعتماد" }).count()).toBeLessThan(before);
    }).toPass();
  });

  test("client portal renders the simplified celebrity view", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/portal");
    await expect(page.getByRole("heading", { name: /مرحبًا/ })).toBeVisible();
    await expect(page.getByText("يحتاج موافقتك")).toBeVisible();
    // No full sidebar in the portal shell.
    await expect(page.locator("aside.sidebar")).toHaveCount(0);
  });

  test("authenticated CSV export returns a text/csv attachment", async ({ page }) => {
    await login(page, CREATOR);
    const res = await page.request.get("/api/reports/revenue");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    expect(res.headers()["content-disposition"]).toContain("attachment");
    const body = await res.text();
    expect(body).toContain("تقرير الإيرادات والمدفوعات");
  });

  test("TikTok integration is clearly in Mock mode (no fake live integration)", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/integrations");
    await expect(page.getByText("الوضع التجريبي (Mock)")).toBeVisible();
  });

  test("printable report renders real data with a KPI summary", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/reports/contracts");
    await expect(page.getByRole("heading", { name: "تقرير العقود والالتزامات" })).toBeVisible();
    await expect(page.getByText("قيمة العقود")).toBeVisible();
  });
});
