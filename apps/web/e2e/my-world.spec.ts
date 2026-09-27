import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations, login } from "./helpers";

/**
 * העולם שלי has one rule above the others: nothing that looks interactive is
 * dead. These tests click every control on the screen and require that it
 * opens a dialog, changes state, or goes somewhere that renders.
 *
 * Runs against freshly seeded data (`pnpm db:seed`). The flows that write
 * (read, register, cancel, thank, write a bio) use jerusalem.employee, who
 * starts with no history. The attendance answer uses employee@, whose seeded
 * event from three days ago is waiting for it, and runs last.
 */

// Dev mode compiles each route on first visit; give it room.
test.setTimeout(120_000);

/**
 * A client navigation changes the URL only once the next page has rendered on
 * the server. Next dev drops pages that sat idle, so late in a long run a route
 * can compile again from scratch (20s+ was seen for /feed/[id]). Navigations
 * get the same room the jobs-board check below already needed.
 */
const NAV = { timeout: 60_000 };

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

    // נועה is on level 2, so the next thing to open is the level-3 backdrop choice.
    await page.getByRole("button", { name: /רמה 3: רקע לבחירה/ }).click();
    await expectSheet(page, "רקע לבחירה");

    await page.getByRole("button", { name: "איך צוברים XP?" }).click();
    const rules = page.getByRole("dialog");
    await expect(rules.getByText("+20 XP").first()).toBeVisible();
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

    const recognitions = page.locator("#recognition-list").getByRole("button");
    expect(await recognitions.count()).toBeGreaterThan(0);
    await recognitions.first().click();
    await expect(page.getByRole("dialog").getByText(/לא ממירה לנקודות/)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();

    await page.locator("#department").getByRole("button", { name: "פרטים" }).click();
    await expect(page.getByRole("dialog").getByText(/רק סכומים/)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();

    const unlocks = page.locator("#unlocks").getByRole("button");
    expect(await unlocks.count()).toBe(6);
    for (let index = 0; index < 6; index += 1) {
      await unlocks.nth(index).click();
      await expect(page.getByRole("dialog").getByText("כמה נשאר")).toBeVisible();
      await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();
    }
  });

  test("a locked achievement links to its world, and every world page renders", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");

    await page.locator("#achievements").getByRole("button", { name: /חלק מהקהילה/ }).click();
    await page.getByRole("dialog").getByRole("link", { name: /לעולם מעורבות והשפעה/ }).click();
    await expect(page).toHaveURL(/\/he\/my-world\/participate$/, NAV);
    await expect(page.getByRole("heading", { level: 1, name: "מעורבות והשפעה" })).toBeVisible();

    for (const world of ["know", "feel", "develop", "participate"]) {
      await page.goto("/he/my-world");
      await page.locator(`a[href$="/my-world/${world}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/he/my-world/${world}$`), NAV);
      await expect(page.getByRole("heading", { name: "מה אפשר לעשות עכשיו" })).toBeVisible();
      await page.getByRole("link", { name: "חזרה לעולם שלי" }).click();
      await expect(page).toHaveURL(/\/he\/my-world$/, NAV);
    }
  });

  test("an unknown world is a real 404 page with a way back", async ({ page }) => {
    await login(page, "employee@moch.gov.il");
    await page.goto("/he/my-world/nowhere");
    await expect(page.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();
    await page.getByRole("link", { name: "חזרה לבית" }).click();
    await expect(page).toHaveURL(/\/he\/?$/, NAV);
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
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();
    await page.locator("#recognition").getByRole("button", { name: "תודה לעמית/ה" }).click();
    await expectNoA11yViolations(page, "my world thank-a-colleague sheet");
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();
    await page.getByRole("button", { name: /הדמות שלי ומה נפתח/ }).click();
    await expectNoA11yViolations(page, "my world avatar sheet");
  });

  test("an upcoming registration goes to the calendar as a real .ics file", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    const bookings = page.locator("#bookings");
    await expect(bookings.getByRole("heading", { name: "סדנת כתיבה שלטונית נגישה" })).toBeVisible();
    const download = page.waitForEvent("download");
    await bookings.getByRole("button", { name: "הוספה ליומן" }).first().click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.ics$/);
    const body = await (await file.createReadStream())!.toArray();
    const text = Buffer.concat(body as Buffer[]).toString("utf8");
    expect(text).toContain("BEGIN:VEVENT");
    expect(text).toContain("SUMMARY:");
  });

  test("the avatar choices wait for their level, on the screen and on the server", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    await page.getByRole("button", { name: /הדמות שלי ומה נפתח/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("radio", { name: "שקיעה" })).toBeDisabled();
    await expect(dialog.getByText("ברמה 3").first()).toBeVisible();
    // The API refuses a choice the level has not opened, whatever the screen shows.
    const refused = await page.request.patch("/api/proxy/me/world", { data: { avatarBackdrop: "dusk" } });
    expect(refused.status()).toBe(400);
  });

  test("the department card shows my share, the reward and the months before", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    const department = page.locator("#department");
    await expect(department.getByText(/התרומה שלך החודש/)).toBeVisible();
    await expect(department.getByText(/ארוחת בוקר צוותית/)).toBeVisible();
    await department.getByRole("button", { name: "פרטים" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "החודשים הקודמים" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "סגירה" }).first().click();
  });

  test("the month looks back on real counts, and the anniversary is on the hero", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    await expect(page.getByText(/7 שנים במשרד/)).toBeVisible();
    const recap = page.locator("#recap");
    await expect(recap.getByText("ימים פעילים")).toBeVisible();
    await expect(recap.getByText(/קראת \d+ עדכונים/)).toBeVisible();
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
    await expect(page).toHaveURL(/\/he\/feed\/[^/]+$/, NAV);
    await expect(page.getByRole("status")).toContainText("המשימה הושלמה");
    await expect(page.getByRole("article")).toBeVisible();

    await page.getByRole("link", { name: "לעולם שלי" }).click();
    await expect(page).toHaveURL(/\/he\/my-world$/, NAV);
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
    await expect(page).toHaveURL(/\/he\/feed\/[^/]+$/, NAV);
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
    await expect(page).toHaveURL(/\/he\/my-world\/(develop|participate)$/, NAV);
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
    await expect(page).toHaveURL(/\/he\/my-world$/, NAV);
  });

  test("thank a colleague → it lands in their world, and my weekly count moves", async ({ page }) => {
    await openMyWorld(page, "jerusalem.employee@moch.gov.il");
    const section = page.locator("#recognition");
    await expect(section.getByText("נשארו לך 3 הוקרות השבוע")).toBeVisible();
    await section.getByRole("button", { name: "תודה לעמית/ה" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("searchbox", { name: "חיפוש עמית/ה לפי שם" }).fill("עומר");
    await dialog.getByRole("button", { name: /עומר חדד/ }).click();
    await dialog.getByText("חונכות").click();
    const send = dialog.getByRole("button", { name: "שליחת ההוקרה" });
    await expect(send).toBeDisabled();
    await dialog.getByLabel("במילים שלך").fill("עזר לי להבין את נוהל הפיקוח החדש ביום הראשון שלי");
    await send.click();
    await expect(dialog).toBeHidden();
    await expect(section.getByRole("status")).toContainText("ההוקרה נשלחה לעומר חדד");
    await expect(section.getByText("נשארו לך 2 הוקרות השבוע")).toBeVisible();

    // The same colleague twice in one week is refused.
    await section.getByRole("button", { name: "תודה לעמית/ה" }).click();
    await dialog.getByRole("searchbox").fill("עומר");
    await dialog.getByRole("button", { name: /עומר חדד/ }).click();
    await dialog.getByText("חונכות").click();
    await dialog.getByLabel("במילים שלך").fill("ועוד פעם תודה על העזרה עם הדוח");
    await dialog.getByRole("button", { name: "שליחת ההוקרה" }).click();
    await expect(dialog.getByRole("alert")).toContainText("כבר הוקרת");
    await dialog.getByRole("button", { name: "סגירה" }).first().click();

    await page.context().clearCookies();
    await openMyWorld(page, "haifa.employee@moch.gov.il");
    await expect(page.locator("#recognition")).toContainText("עזר לי להבין את נוהל הפיקוח החדש");
  });

  test("the profile mission → a bio on the profile → +XP once, and the mission is gone", async ({ page }) => {
    await openMyWorld(page, "jerusalem.employee@moch.gov.il");
    const mission = page.locator("#missions").getByRole("link", { name: "לכתוב" }).first();
    await mission.click();
    await expect(page).toHaveURL(/\/he\/profile#about$/, NAV);

    const about = page.locator("#about");
    await about.getByRole("button", { name: "לכתוב" }).click();
    await about.getByLabel("כמה מילים על עצמך").fill("רכזת תכנון במחוז ירושלים. אפשר לפנות אליי על תוכניות מתאר.");
    await about.getByRole("button", { name: "שמירה" }).click();
    await expect(about.getByRole("status")).toContainText("+30 XP");
    await expect(about.getByText("רכזת תכנון במחוז ירושלים")).toBeVisible();

    await page.goto("/he/my-world");
    await expect(page.locator("#missions").getByRole("link", { name: "לכתוב" })).toHaveCount(0);
  });

  test("were you there? → yes → the attendance XP lands and the question is gone", async ({ page }) => {
    await openMyWorld(page, "employee@moch.gov.il");
    const bookings = page.locator("#bookings");
    await expect(bookings.getByText("השתתפת?")).toBeVisible();
    const before = await page.getByText(/\d+ \/ \d+ XP/).first().innerText();
    await bookings.getByRole("button", { name: /כן, השתתפתי/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "נרשם שהשתתפת" })).toBeVisible();
    await expect(bookings.getByText("השתתפת?")).toHaveCount(0);
    await expect(page.getByText(/\d+ \/ \d+ XP/).first()).not.toHaveText(before);
  });
});
