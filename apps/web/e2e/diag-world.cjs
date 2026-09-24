const { chromium } = require("@playwright/test");

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(45000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://localhost:3001/he/login");
  await page.getByLabel("כתובת דוא״ל").fill("employee@moch.gov.il");
  await page.getByLabel("סיסמה").fill("Moch2026!");
  await page.getByRole("button", { name: "כניסה", exact: true }).click();
  await page.waitForURL("**/he");
  await page.goto("http://localhost:3001/he/my-world");
  await page.getByRole("heading", { name: /שלום/ }).waitFor();

  const before = await page.locator("body").innerText();
  const must = [
    "הצעד של היום עדיין פתוח",
    "2 / 3",
    "השבוע",
    "יש לך יום גמיש",
    "השבוע אני מתמקד ב",
    "התחרות בין המחוזות",
    "עובדי המטה צופים בתחרות",
    "720",
  ];
  const missing = must.filter((text) => !before.includes(text));

  await page.getByRole("button", { name: "KNOW" }).click();
  const pressed = await page.getByRole("button", { name: "KNOW" }).getAttribute("aria-pressed");

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.getByRole("link", { name: "התחל" }).first().click();
  await page.waitForURL("**/feed**");
  await page.goto("http://localhost:3001/he/my-world");
  await page.getByRole("heading", { name: /שלום/ }).waitFor();
  const afterGlance = await page.locator("body").innerText();

  await page.goto("http://localhost:3001/he/feed");
  const readMore = page.getByRole("button", { name: "קריאה נוספת" }).first();
  const hadReadMore = await readMore.count();
  if (hadReadMore) {
    await readMore.click();
    await page.waitForTimeout(800);
  } else {
    const opened = await page.evaluate(async () => {
      const list = await fetch("/api/proxy/feed/posts").then((response) => response.json());
      const post = list.items?.[0];
      if (!post?.id) return { error: "no-post", keys: Object.keys(list) };
      const full = await fetch(`/api/proxy/feed/posts/${post.id}`);
      return { status: full.status, id: post.id };
    });
    console.log("fallback-read", JSON.stringify(opened));
  }

  await page.goto("http://localhost:3001/he/my-world");
  await page.getByRole("heading", { name: /שלום/ }).waitFor();
  const afterRead = await page.locator("body").innerText();

  console.log(
    JSON.stringify(
      {
        missing,
        pressed,
        overflow,
        hadReadMore,
        glanceStillTwo: afterGlance.includes("2 / 3"),
        glanceStill720: afterGlance.includes("720"),
        afterHasThree: afterRead.includes("3 / 3"),
        afterHas740: afterRead.includes("740"),
        afterDepartment: afterRead.includes("המחלקה התקדמה"),
        errors,
      },
      null,
      2,
    ),
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
