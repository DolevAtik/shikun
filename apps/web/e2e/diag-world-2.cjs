const { chromium } = require("@playwright/test");

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  await page.goto("http://localhost:3001/he/login");
  await page.getByLabel("כתובת דוא״ל").fill("employee@moch.gov.il");
  await page.getByLabel("סיסמה").fill("Moch2026!");
  await page.getByRole("button", { name: "כניסה", exact: true }).click();
  await page.waitForURL("**/he");

  await page.goto("http://localhost:3001/he/feed");
  await page.getByRole("button", { name: "קריאה נוספת" }).first().waitFor({ timeout: 20000 }).catch(() => undefined);
  const readMore = await page.getByRole("button", { name: "קריאה נוספת" }).count();

  const patch = page.waitForResponse((response) => response.url().includes("/me/world") && response.request().method() === "PATCH");
  await page.goto("http://localhost:3001/he/my-world");
  await page.getByRole("heading", { name: /שלום/ }).waitFor();
  await page.getByRole("button", { name: "KNOW" }).click();
  const response = await patch;
  await page.getByRole("button", { name: "KNOW", pressed: true }).waitFor({ timeout: 5000 }).catch(() => undefined);
  const pressed = await page.getByRole("button", { name: "KNOW" }).getAttribute("aria-pressed");

  console.log(JSON.stringify({ readMore, patchStatus: response.status(), pressed }));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
