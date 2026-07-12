import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "Moch2026!";

export async function login(page: Page, email: string, locale = "he") {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(locale === "he" ? "כתובת דוא״ל" : "Email address").fill(email);
  await page
    .getByLabel(locale === "he" ? "סיסמה" : "Password")
    .fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: locale === "he" ? "כניסה" : "Sign in", exact: true }).click();
  await page.waitForURL(`**/${locale}`);
}

/**
 * IS 5568 — Israel's accessibility standard for a public body — is WCAG 2.0 AA,
 * and it is enforceable with statutory damages. So this is not a nice-to-have
 * check: a violation here is a legal exposure, and the build should fail.
 */
export async function expectNoA11yViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (violation) =>
          `  [${violation.impact}] ${violation.id}: ${violation.help}\n` +
          violation.nodes.map((node) => `      ${node.target.join(" ")}`).join("\n"),
      )
      .join("\n");
    console.error(`\nWCAG 2.0 AA violations on ${context}:\n${summary}\n`);
  }

  expect(results.violations, `${context} must have zero WCAG 2.0 AA violations`).toEqual([]);
}

export async function setDarkMode(page: Page) {
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  });
}
