import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, login, setDarkMode } from "./helpers";

test.describe("accessibility — IS 5568 / WCAG 2.0 AA", () => {
  test("login page is clean", async ({ page }) => {
    await page.goto("/he/login");
    await expectNoA11yViolations(page, "login (he, light)");
  });

  test("home is clean in Hebrew, light and dark", async ({ page }) => {
    await login(page, "haifa.employee@moch.gov.il");
    await expectNoA11yViolations(page, "home (he, light)");

    await setDarkMode(page);
    await expectNoA11yViolations(page, "home (he, dark)");
  });

  test("home is clean in English (LTR)", async ({ page }) => {
    await login(page, "haifa.employee@moch.gov.il");
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expectNoA11yViolations(page, "home (en, light)");
  });

  test("feed is clean", async ({ page }) => {
    await login(page, "haifa.employee@moch.gov.il");
    await page.goto("/he/feed");
    await page.getByRole("article").first().waitFor();
    await expectNoA11yViolations(page, "feed (he, light)");
  });

  test("the job board is clean", async ({ page }) => {
    await login(page, "haifa.employee@moch.gov.il");
    await page.goto("/he/jobs");
    await page.getByRole("heading", { name: "לוח משרות" }).waitFor();
    await expectNoA11yViolations(page, "jobs (he, light)");
  });
});

test.describe("direction", () => {
  test("Hebrew renders RTL and English renders LTR", async ({ page }) => {
    await page.goto("/he/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");

    await page.goto("/en/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("audience targeting", () => {
  const HAIFA_ONLY = "שינוי במיקום משרדי מחוז חיפה";

  test("a Haifa employee sees the district announcement", async ({ page }) => {
    await login(page, "haifa.employee@moch.gov.il");
    await expect(page.getByText(HAIFA_ONLY)).toBeVisible();
  });

  test("a Jerusalem employee does not", async ({ page }) => {
    await login(page, "jerusalem.employee@moch.gov.il");

    // The Ministry-wide announcement is there…
    await expect(page.getByText("מסלול חדש לרוכשי דירה ראשונה").first()).toBeVisible();
    // …and the Haifa-targeted one is nowhere on the page. This is the whole
    // audience model in one assertion.
    await expect(page.getByText(HAIFA_ONLY)).toHaveCount(0);
  });
});

test.describe("home", () => {
  test("greets the employee and renders the Director-General's message", async ({ page }) => {
    await login(page, "employee@moch.gov.il");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("נועה");
    await expect(page.getByRole("heading", { name: "מסר מהמנכ״ל" })).toBeVisible();
    await expect(page.getByText("על הקצב שבו אנחנו עובדים")).toBeVisible();
  });

  test("emergency alert is announced to assistive tech", async ({ page }) => {
    await login(page, "employee@moch.gov.il");

    const alert = page.getByRole("alert").filter({ hasText: "תרגיל חירום ארצי" });
    await expect(alert).toBeVisible();
  });
});

test.describe("feed", () => {
  test("liking a post is optimistic and persists across reload", async ({ page }) => {
    await login(page, "employee@moch.gov.il");
    await page.goto("/he/feed");

    const firstPost = page.getByRole("article").first();
    const likeButton = firstPost.getByRole("button", { name: /אהבתי/ });

    const wasPressed = (await likeButton.getAttribute("aria-pressed")) === "true";
    await likeButton.click();
    await expect(likeButton).toHaveAttribute("aria-pressed", String(!wasPressed));

    await page.reload();
    const afterReload = page.getByRole("article").first().getByRole("button", { name: /אהבתי/ });
    await expect(afterReload).toHaveAttribute("aria-pressed", String(!wasPressed));
  });

  test("filtering by channel narrows the feed", async ({ page }) => {
    await login(page, "employee@moch.gov.il");
    await page.goto("/he/feed");
    await page.getByRole("article").first().waitFor();

    await page.getByRole("button", { name: "חדשנות", exact: true }).click();
    await expect(page.getByRole("article")).toHaveCount(1);
    await expect(page.getByText("אוטומציה שחוסכת 30 שעות בחודש")).toBeVisible();
  });

  test("commenting adds the comment to the thread", async ({ page }) => {
    await login(page, "employee@moch.gov.il");
    await page.goto("/he/feed");

    // Comments persist, so a fixed string would collide with the last run's.
    const body = `נבדק אוטומטית ${Date.now()}`;

    const firstPost = page.getByRole("article").first();
    await firstPost.getByRole("button", { name: /תגובה/ }).click();

    const input = firstPost.getByPlaceholder("כתיבת תגובה…");
    await input.fill(body);
    await firstPost.getByRole("button", { name: "שליחה" }).click();

    await expect(firstPost.getByText(body)).toBeVisible();
    // And it survives a reload, which is the difference between a comment and
    // an optimistic lie.
    await page.reload();
    await page.getByRole("article").first().getByRole("button", { name: /תגובה/ }).click();
    await expect(page.getByText(body)).toBeVisible();
  });
});

test.describe("job board", () => {
  /** The board's own headings, not the ones in the nav bar or the header. */
  const positions = (page: Page) => page.locator("#main").getByRole("heading", { level: 3 });

  test("is reachable from the bottom nav and leads with the closest deadline", async ({ page }) => {
    await login(page, "employee@moch.gov.il");

    await page.getByRole("navigation", { name: "ניווט ראשי" }).getByRole("link", { name: "משרות" }).click();
    await page.waitForURL("**/he/jobs");

    // Seeded to close in two days — a board that does not sort by deadline is a
    // list, and this assertion is the difference.
    await expect(positions(page).first()).toHaveText("מנהל/ת תחום רכש");
    await expect(page.getByText("נסגר בעוד יומיים")).toBeVisible();

    // The position with no deadline sorts last, and says so instead of showing a date.
    await expect(positions(page).last()).toHaveText("רכז/ת שיווק קרקעות");
    await expect(page.getByText("פתוח עד לאיוש")).toBeVisible();
  });

  test("filtering by scope narrows the board and survives a reload", async ({ page }) => {
    await login(page, "employee@moch.gov.il");
    await page.goto("/he/jobs");

    await page.getByRole("link", { name: /מכרזים פומביים/ }).click();
    await page.waitForURL("**/he/jobs?scope=external");

    // The two public tenders, and neither of the internal roles.
    await expect(positions(page)).toHaveCount(2);
    await expect(page.getByText("משרה פנימית")).toHaveCount(0);

    // The filter is in the URL, so the back button and a shared link both work.
    await page.reload();
    await expect(positions(page)).toHaveCount(2);
  });

  test("a district-targeted opening is invisible to another district", async ({ page }) => {
    const HAIFA_ONLY = "מפקח/ת בנייה — מחוז חיפה";

    await login(page, "haifa.employee@moch.gov.il");
    await page.goto("/he/jobs");
    await expect(page.getByText(HAIFA_ONLY)).toBeVisible();
  });

  test("…and a Jerusalem employee never sees it", async ({ page }) => {
    await login(page, "jerusalem.employee@moch.gov.il");
    await page.goto("/he/jobs");

    // The Ministry-wide openings are there…
    await expect(page.getByText("מנהל/ת תחום רכש")).toBeVisible();
    // …and the Haifa-only one is not on the board at all.
    await expect(page.getByText("מפקח/ת בנייה — מחוז חיפה")).toHaveCount(0);
  });
});

test.describe("keyboard", () => {
  test("the skip link is the first stop and it works", async ({ page }) => {
    await login(page, "employee@moch.gov.il");

    // Land on a fresh document, the way a keyboard user arrives — rather than
    // inheriting whatever the login button click left focused.
    await page.goto("/he");
    await page.getByRole("heading", { level: 1 }).waitFor();

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "דילוג לתוכן הראשי" });
    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeVisible();
  });
});
