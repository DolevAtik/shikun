#!/usr/bin/env node
/**
 * WCAG 2.0 AA contrast gate.
 *
 * IS 5568 — the Israeli accessibility standard, which is legally binding for a
 * public body and carries statutory damages — is essentially WCAG 2.0 AA. So
 * contrast is not a design preference here, it is a legal floor, and it is
 * cheaper to fail a build than to fail an audit.
 *
 * This reads the real token values out of tokens.css and checks every
 * foreground/background pair the product actually renders, in both themes.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "packages/ui/src/tokens.css"), "utf8");

function parseBlock(selector) {
  const match = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "m").exec(css);
  if (!match) throw new Error(`Could not find ${selector} in tokens.css`);

  const tokens = {};
  for (const line of match[1].split("\n")) {
    const decl = /^\s*(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(line);
    if (decl) tokens[decl[1]] = decl[2];
  }
  return tokens;
}

function toRgb(hex) {
  let value = hex.replace("#", "");
  if (value.length === 3) value = [...value].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

function relativeLuminance(hex) {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Every pair the UI actually puts on screen. Text below 18.66px bold / 24px
 * regular needs 4.5:1; large text and UI component boundaries need 3:1.
 */
const PAIRS = [
  ["--text", "--bg", 4.5, "body text on the page"],
  ["--text", "--surface", 4.5, "body text on a card"],
  ["--text", "--surface-tint", 4.5, "body text on a tinted card"],
  ["--text-muted", "--bg", 4.5, "secondary text on the page"],
  ["--text-muted", "--surface", 4.5, "secondary text on a card"],
  ["--text-on-brand", "--brand-blue", 4.5, "label on a primary button"],
  ["--on-surface-brand", "--surface-brand", 4.5, "header text on the brand header"],
  ["--on-surface-brand", "--hero-from", 4.5, "hero card text (gradient start)"],
  ["--on-surface-brand", "--hero-to", 4.5, "hero card text (gradient end)"],
  ["--brand-blue", "--surface", 4.5, "link / active tab on a card"],
  ["--brand-blue", "--bg", 4.5, "link on the page"],
  ["--brand-blue", "--brand-blue-soft", 4.5, "brand text on its own soft tint"],
  ["--accent-red", "--surface", 4.5, "district chip: Center"],
  ["--accent-green", "--surface", 4.5, "district chip: North"],
  ["--accent-amber", "--surface", 4.5, "district chip: Jerusalem"],
  ["--accent-blue", "--surface", 4.5, "accent text"],
  ["--accent-teal", "--surface", 4.5, "district chip: Haifa"],
  ["--accent-violet", "--surface", 4.5, "district chip: South"],
  ["--danger", "--surface", 4.5, "error text"],
  ["--danger", "--danger-soft", 4.5, "critical alert text on its banner"],
  ["--warning", "--warning-soft", 4.5, "warning alert text on its banner"],
  ["--success", "--success-soft", 4.5, "success text on its banner"],
  ["--border-strong", "--surface", 3, "input border against a card"],

  /**
   * The admin console adds these. Each one is a shadcn/ui semantic pair that
   * `apps/admin/src/app/shadcn-bridge.css` aliases onto the tokens above — so
   * they render in the product even though no employee screen uses them.
   *
   * `--danger-on` on `--danger` is the one that matters: shadcn's stock
   * destructive-foreground is white, and in dark mode `--danger` is a *light*
   * red. White on it is 2.17:1 — a failing button, shipped by default.
   */
  ["--danger-on", "--danger", 4.5, "label on a destructive button (shadcn --destructive)"],
  ["--text-muted", "--surface-sunken", 4.5, "muted text on a sunken panel (shadcn --muted)"],
  ["--text", "--surface-raised", 4.5, "text in a popover or dropdown (shadcn --popover)"],
  ["--text", "--surface-sunken", 4.5, "text on a sunken panel (table header, toolbar)"],
];

/**
 * shadcn leans on alpha: `hover:bg-muted/50` on a table row, `bg-primary/10` on
 * a selected one. The composited pair is what the eye sees, and it is not the
 * pair checked above — the same blind spot that let the Chip fail at 4.08:1.
 *
 * [foreground, tint color, base it composites over, alpha, minimum, description]
 */
const COMPOSITE_PAIRS = [
  ["--text", "--surface-sunken", "--surface", 0.5, 4.5, "row text on a hovered table row"],
  ["--text-muted", "--surface-sunken", "--surface", 0.5, 4.5, "muted cell text on a hovered row"],
  ["--text", "--brand-blue", "--surface", 0.1, 4.5, "row text on a selected table row"],
  ["--text", "--danger", "--surface", 0.1, 4.5, "row text on a row flagged for deletion"],
];

/**
 * The Chip component draws colored text on a 12% tint of the same color. axe
 * caught this pair failing at 4.08:1 on a real page — the static check above
 * only tested the color against a plain white card, which is not what ships.
 * So compose the tint here and check the pair that actually renders.
 */
function tintOver(color, background, alpha = 0.12) {
  const fg = toRgb(color);
  const bg = toRgb(background);
  const mixed = fg.map((channel, index) => Math.round(alpha * channel + (1 - alpha) * bg[index]));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Every token that is ever rendered as chip text on a tint of itself. */
const CHIP_TOKENS = [
  "--accent-red",
  "--accent-green",
  "--accent-amber",
  "--accent-blue",
  "--accent-teal",
  "--accent-violet",
  "--brand-blue",
  "--brand-navy",
  "--district-north",
  "--district-haifa",
  "--district-center",
  "--district-jerusalem",
  "--district-south",
];

let failures = 0;
let checks = 0;

for (const theme of ["\\:root", "\\.dark"]) {
  const tokens = parseBlock(theme);
  const label = theme === "\\:root" ? "light" : "dark";

  for (const [fg, bg, minimum, description] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.error(`  MISSING  [${label}] ${fg} or ${bg} is not defined`);
      failures++;
      continue;
    }

    checks++;
    const ratio = contrast(tokens[fg], tokens[bg]);
    if (ratio < minimum) {
      failures++;
      console.error(
        `  FAIL     [${label}] ${ratio.toFixed(2)}:1 (needs ${minimum}:1) — ${description}` +
          `\n           ${fg} ${tokens[fg]} on ${bg} ${tokens[bg]}`,
      );
    }
  }

  // Chip: colored text on a 12% tint of itself, composited over the card.
  for (const token of CHIP_TOKENS) {
    const color = tokens[token];
    if (!color) continue;

    checks++;
    const tint = tintOver(color, tokens["--surface"]);
    const ratio = contrast(color, tint);
    if (ratio < 4.5) {
      failures++;
      console.error(
        `  FAIL     [${label}] ${ratio.toFixed(2)}:1 (needs 4.5:1) — chip text on its own tint` +
          `\n           ${token} ${color} on ${tint}`,
      );
    }
  }

  // Alpha surfaces: what the row actually looks like once the tint is composited.
  for (const [fg, tintToken, baseToken, alpha, minimum, description] of COMPOSITE_PAIRS) {
    if (!tokens[fg] || !tokens[tintToken] || !tokens[baseToken]) {
      console.error(`  MISSING  [${label}] a token in "${description}" is not defined`);
      failures++;
      continue;
    }

    checks++;
    const background = tintOver(tokens[tintToken], tokens[baseToken], alpha);
    const ratio = contrast(tokens[fg], background);
    if (ratio < minimum) {
      failures++;
      console.error(
        `  FAIL     [${label}] ${ratio.toFixed(2)}:1 (needs ${minimum}:1) — ${description}` +
          `\n           ${fg} ${tokens[fg]} on ${tintToken} @ ${alpha} over ${baseToken} = ${background}`,
      );
    }
  }
}


if (failures > 0) {
  console.error(`\nContrast gate failed: ${failures} of ${checks + failures} pairs below WCAG 2.0 AA.`);
  console.error("Darken the token. The brand bends; the standard does not.\n");
  process.exit(1);
}

console.log(`Contrast gate passed: ${checks} pairs, both themes, all at or above WCAG 2.0 AA.`);
