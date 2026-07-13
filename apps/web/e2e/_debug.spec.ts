import { test } from "@playwright/test";
import { login, setDarkMode } from "./helpers";

// Temporary — a way to look at the job board. Deleted before commit.
const OUT = "C:/Users/User/AppData/Local/Temp/claude/c--Users-User-shikun/b7728569-c4dd-4eac-87d5-3975fa9e62c5/scratchpad";

test("job board screenshots", async ({ page }) => {
  await login(page, "haifa.employee@moch.gov.il");

  await page.goto("/he/jobs");
  await page.getByRole("heading", { name: "לוח משרות" }).waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/jobs-he-light.png`, fullPage: true });

  await page.goto("/he/jobs?scope=external");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/jobs-he-external.png`, fullPage: true });

  await setDarkMode(page);
  await page.goto("/he/jobs");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/jobs-he-dark.png`, fullPage: true });

  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  });
  await page.goto("/en/jobs");
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/jobs-en-ltr.png`, fullPage: true });
});
