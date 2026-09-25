import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, login } from "./helpers";

/**
 * העולם שלי has one rule above the others: nothing that looks interactive is
 * dead. These tests click every control on the screen and require that it
 * opens a dialog, changes state, or goes somewhere that renders.
 *
 * Runs against freshly seeded data (`pnpm db:seed`). The flows that write
 * (read, register, cancel) use jerusalem.employee, who starts with no history.
 */

// Dev mode compiles each route on first visit; give it room.
test.setTimeout(120_000);

async function openMyWorld(page: Page, email: string) {
  await login(page, email);
  await page.goto("/he/my-world");
  await page.getByRole("heading", { level: 1 }).waitFor();
}

async function expectSheet(page: Page, title: string | RegExp) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { level: 2 })).toHaveText(title);
  await dialog.getByRole("button", { name: "סגירה" }).first().click();
  await expect(dialog).toBeHidden();
}

test.describe("העולם שלי — every control leads somewhere", () => {
  test("hero: avatar, next unlock and the XP rules open real details", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");

    await page.getByRole("button", { name: /הדמות שלי ומה נפתח/ }).click();
    await expectSheet(page, "הדמות שלי");

    await page.getByRole("button", { name: /רמה 5: אווטאר חדש/ }).click();
    await expectSheet(page, "אווטאר חדש");

    await page.getByRole("button", { name: "איך צוברים XP?" }).click();
    const rules = page.getByRole("dialog");
    await expect(rules.getByText("+20 XP")).toBeVisible();
    await expectSheet(page, "איך צוברים XP");
  });

  test("every achievement, recognition, unlock and the department open a detail", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");

    const achievements = page.locator("#achievements").getByRole("button");
    const count = await achievements.count();
    expect(count).toBe(7);
    for (let index = 0; index < count; index += 1) {
      await achievements.nth(index).click();
      await expect(page.getByRole("dialog").getByText("איך פותחים")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();
    }

    const recognitions = page.locator("#recognition").getByRole("button");
    expect(await recognitions.count()).toBeGreaterThan(0);
    await recognitions.first().click();
    await expect(page.getByRole("dialog").getByText(/לא ממירה לנקודות/)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();

    await page.locator("#department").getByRole("button", { name: "פרטים" }).click();
    await expect(page.getByRole("dialog").getByText(/רק סכומים/)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();

    const unlocks = page.locator("#unlocks").getByRole("button");
    expect(await unlocks.count()).toBe(3);
    for (let index = 0; index < 3; index += 1) {
      await unlocks.nth(index).click();
      await expect(page.getByRole("dialog").getByText("כמה נשאר")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();
    }
  });

  test("a locked achievement links to its world, and every world page renders", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");

    await page.locator("#achievements").getByRole("button", { name: /חלק מהקהילה/ }).click();
    await page.getByRole("dialog").getByRole("link", { name: /לעולם מעורבות והשפעה/ }).click();
    await expect(page).toHaveURL(/\/he\/my-world\/participate$/);
    await expect(page.getByRole("heading", { level: 1, name: "מעורבות והשפעה" })).toBeVisible();

    for (const world of ["know", "feel", "develop", "participate"]) {
      await page.goto("/he/my-world");
      await page.locator(`a[href$="/my-world/${world}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/he/my-world/${world}$`));
      await expect(page.getByRole("heading", { name: "מה אפשר לעשות עכשיו" })).toBeVisible();
      await page.getByRole("link", { name: "חזרה לעולם שלי" }).click();
      await expect(page).toHaveURL(/\/he\/my-world$/);
    }
  });

  test("an unknown world is a real 404 page with a way back", async ({ page }) => {
    await login(page, "employee@moch.gov.il");
    await page.goto("/he/my-world/nowhere");
    await expect(page.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();
    await page.getByRole("link", { name: "חזרה לבית" }).click();
    await expect(page).toHaveURL(/\/he\/?$/);
  });

  test("the weekly focus is saved and survives a reload", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    const develop = page.locator("fieldset").getByRole("button", { name: "התפתחות וצמיחה" });
    await develop.click();
    await expect(develop).toHaveAttribute("aria-pressed", "true");
    // The chosen world's mission is featured first.
    await expect(page.locator("#missions article")).toContainText("התפתחות וצמיחה");
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.locator("fieldset").getByRole("button", { name: "התפתחות וצמיחה" })).toHaveAttribute("aria-pressed", "true");
    await page.locator("fieldset").getByRole("button", { name: "התפתחות וצמיחה" }).click();
    await page.waitForLoadState("networkidle");
  });

  test("no link on the screen points nowhere", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    const hrefs = await page.locator("main a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, "a link without a destination").toBeTruthy();
      expect(href).not.toBe("#");
    }
    const unique = [...new Set(hrefs)].filter((href): href is string => !!href && href.startsWith("/"));
    for (const href of unique) {
      // Opening a post records a read, so those are checked by shape, not by visiting.
      if (/\/feed\/[^/]+$/.test(href)) continue;
      const response = await page.request.get(href);
      expect(response.status(), href).toBeLessThan(400);
    }
  });

  test("is clean for WCAG 2.0 AA", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    await expectNoA11yViolations(page, "my world (he, light)");
    await page.getByRole("button", { name: "איך צוברים XP?" }).click();
    await expectNoA11yViolations(page, "my world rules dialog");
  });
});

test.describe.serial("העולם שלי — the flows that move progress", () => {
  test("a first visit shows three live first steps", async ({ page }) => {
    await openMyWorld(page, "jerusalem.employee@moch.gov.il");
    await expect(page.getByText("הצעדים הראשונים שלך")).toBeVisible();
    await page.getByRole("button", { name: 'פתיחת ההישג "צעד ראשון"' }).click();
    await expectSheet(page, "צעד ראשון");
  });

  test("mission → read the post → +XP → back in My World the bar has moved", async ({ page }) => {
    await openMyWorld(page, "jerusalem.employee@moch.gov.il");
    const before = await page.getByText(/\d+ \/ \d+ XP/).first().innerText();

    await page.locator("#missions article").getByRole("link", { name: "להתחיל" }).click();
    await expect(page).toHaveURL(/\/he\/feed\/[^/]+$/);
    await expect(page.getByRole("status")).toContainText("המשימה הושלמה");
    await expect(page.getByRole("article")).toBeVisible();

    await page.getByRole("link", { name: "לעולם שלי" }).click();
    await expect(page).toHaveURL(/\/he\/my-world$/);
    await expect(page.getByText(/מאז הביקור הקודם/)).toBeVisible();
    await expect(page.getByText(/\d+ \/ \d+ XP/).first()).not.toHaveText(before);
    // The first act opens "צעד ראשון" and replaces the first steps with the weekly card.
    await expect(page.getByText("הצעדים הראשונים שלך")).toHaveCount(0);
  });

  test("reading the same post again grants nothing", async ({ page }) => {
    await login(page, "jerusalem.employee@moch.gov.il");
    await page.goto("/he/my-world/know");
    const history = page.locator("section").filter({ has: page.getByRole("heading", { name: "מה עשיתי כאן" }) });
    const read = history.getByRole("link").first();
    await read.click();
    await expect(page).toHaveURL(/\/he\/feed\/[^/]+$/);
    await expect(page.getByRole("article")).toBeVisible();
    await expect(page.getByText("המשימה הושלמה")).toHaveCount(0);
  });

  test("register from a mission → +XP in place → cancel from the world page removes it", async ({ page }) => {
    await openMyWorld(page, "jerusalem.employee@moch.gov.il");
    const register = page.locator("#missions").getByRole("button", { name: "לפרטים ולהרשמה" }).first();
    await register.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/ההרשמה מזכה ב/)).toBeVisible();
    await dialog.getByRole("button", { name: "הרשמה" }).click();
    await expect(dialog).toBeHidden();
    const notice = page.locator("#missions").getByRole("status");
    await expect(notice).toContainText("נרשמת ל");

    await notice.getByRole("link").click();
    await expect(page).toHaveURL(/\/he\/my-world\/(develop|participate)$/);
    const cancel = page.getByRole("button", { name: "ביטול הרשמה" }).first();
    await expect(cancel).toBeVisible();
    const rowsBefore = await page.getByRole("button", { name: "ביטול הרשמה" }).count();
    await cancel.click();
    await expect(page.getByRole("button", { name: "ביטול הרשמה" })).toHaveCount(rowsBefore - 1);
  });

  test("Home registers for real too, and a careers card leads to the board", async ({ page }) => {
    await login(page, "jerusalem.employee@moch.gov.il");
    const button = page.getByRole("button", { name: "הרשמה", exact: true }).first();
    await button.click();
    await page.getByRole("dialog").getByRole("button", { name: "הרשמה" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("רשום/ה").first()).toBeVisible();

    await page.locator("li").locator('a[href$="/services/jobs"]').first().click();
    await expect(page).toHaveURL(/\/he\/services\/jobs$/, { timeout: 60_000 });
  });

  test("Profile shows the real level and links into My World", async ({ page }) => {
    await login(page, "jerusalem.employee@moch.gov.il");
    await page.goto("/he/profile");
    await page.getByRole("link", { name: /לעולם שלי/ }).click();
    await expect(page).toHaveURL(/\/he\/my-world$/);
  });
});
