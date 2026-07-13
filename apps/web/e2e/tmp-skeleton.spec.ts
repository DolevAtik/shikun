import { expect, test } from "@playwright/test";
import { DEMO_PASSWORD } from "./helpers";

/** TEMPORARY — deleted after the run. Web on :3002 talks to the deployed Render API. */
const BASE = "http://localhost:3002";

test("where the seconds actually go", async ({ page }) => {
  await page.goto(`${BASE}/he/login`);
  await page.getByLabel("כתובת דוא״ל").fill("employee@moch.gov.il");
  await page.getByLabel("סיסמה").fill(DEMO_PASSWORD);

  let loginDoneAt = 0;
  page.on("response", (response) => {
    if (response.url().includes("/api/auth/login") && loginDoneAt === 0) {
      loginDoneAt = Date.now();
    }
  });

  const clickedAt = Date.now();
  await page.getByRole("button", { name: "כניסה", exact: true }).click();

  await expect(page.getByRole("navigation")).toBeVisible({ timeout: 30_000 });
  const shellAt = Date.now();

  await expect(page.getByText("נועה").first()).toBeVisible({ timeout: 30_000 });
  const homeAt = Date.now();

  const login = loginDoneAt - clickedAt;
  console.log(
    [
      "",
      `  login POST (browser → Next → Render) : ${login}ms`,
      `  then shell/nav visible               : +${shellAt - loginDoneAt}ms  (t=${shellAt - clickedAt}ms)`,
      `  then Home content                    : +${homeAt - shellAt}ms  (t=${homeAt - clickedAt}ms)`,
      "",
    ].join("\n"),
  );

  expect(homeAt).toBeGreaterThan(0);
});
