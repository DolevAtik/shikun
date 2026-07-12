import { test } from "@playwright/test";
import { login, setDarkMode } from "./helpers";

/**
 * Not an assertion suite — a way to look at the product. Run with
 * `npx playwright test screenshots` and open apps/web/screenshots/.
 */
test.describe("screenshots", () => {
  test("home, feed and login in both themes", async ({ page }) => {
    await page.goto("/he/login");
    await page.screenshot({ path: "screenshots/01-login.png", fullPage: true });

    await login(page, "haifa.employee@moch.gov.il");
    await page.waitForTimeout(800);
    await page.screenshot({ path: "screenshots/02-home-he-light.png", fullPage: true });

    await setDarkMode(page);
    await page.waitForTimeout(400);
    await page.screenshot({ path: "screenshots/03-home-he-dark.png", fullPage: true });

    await page.goto("/he/feed");
    await page.getByRole("article").first().waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({ path: "screenshots/04-feed-he-dark.png", fullPage: true });

    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: "screenshots/05-feed-he-light.png", fullPage: true });

    await page.goto("/en");
    await page.waitForTimeout(800);
    await page.screenshot({ path: "screenshots/06-home-en-ltr.png", fullPage: true });

    await page.goto("/he/profile");
    await page.waitForTimeout(500);
    await page.screenshot({ path: "screenshots/07-profile.png", fullPage: true });
  });
});
