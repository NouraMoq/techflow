import { test, expect } from "@playwright/test";
import { login, CREATOR } from "./helpers";

test.describe("Asset storage (upload → signed download)", () => {
  test("upload a file, then download it back through a signed URL", async ({ page }) => {
    await login(page, CREATOR);
    await page.goto("/assets");

    // Storage mode banner is shown (Local when no S3 creds).
    await expect(page.getByText(/وضع التخزين/)).toBeVisible();

    await page.getByRole("button", { name: "رفع ملف" }).click();
    await page.setInputFiles('input[type="file"]', {
      name: "e2e-upload.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello e2e storage"),
    });
    await page.getByRole("button", { name: "رفع", exact: true }).click();

    // Server action stored the bytes + created the Asset row.
    await expect(page.getByText(/تم رفع «e2e-upload.txt»/)).toBeVisible();

    await page.getByRole("button", { name: "إغلاق" }).click();
    const link = page.getByRole("link", { name: "e2e-upload.txt" }).first();
    await expect(link).toBeVisible();

    // Fetch through the authenticated asset endpoint → redirects to a signed URL
    // → streams the exact bytes we uploaded.
    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("hello e2e storage");
  });

  test("asset endpoint requires auth (401 unauthenticated)", async ({ request }) => {
    const res = await request.get("/api/storage/asset/does-not-exist");
    expect(res.status()).toBe(401);
  });
});
