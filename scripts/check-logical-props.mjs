#!/usr/bin/env node
/**
 * Bans physical-direction CSS in a bidirectional app.
 *
 * Hebrew reads right-to-left and English reads left-to-right, and this product
 * ships both. A single `ml-4` or `text-left` is a bug that only appears in one
 * language — the kind nobody notices until a user does. Logical properties
 * (`ms-4`, `text-start`) mirror themselves, so the flip costs nothing.
 *
 * This runs in `pnpm lint`. It is a linter for the one mistake this codebase is
 * most likely to make.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = ["apps/web/src", "packages/ui/src"];

/** Tailwind utilities whose logical twin should be used instead. */
const BANNED = [
  [/\b-?ml-[\w.[\]/-]+/g, "ms-*"],
  [/\b-?mr-[\w.[\]/-]+/g, "me-*"],
  [/\bpl-[\w.[\]/-]+/g, "ps-*"],
  [/\bpr-[\w.[\]/-]+/g, "pe-*"],
  [/\bborder-l\b|\bborder-l-[\w.[\]/-]+/g, "border-s / border-s-*"],
  [/\bborder-r\b|\bborder-r-[\w.[\]/-]+/g, "border-e / border-e-*"],
  [/\brounded-l[a-z]?-[\w.[\]/-]+|\brounded-l\b/g, "rounded-s-*"],
  [/\brounded-r[a-z]?-[\w.[\]/-]+|\brounded-r\b/g, "rounded-e-*"],
  [/\btext-left\b/g, "text-start"],
  [/\btext-right\b/g, "text-end"],
  [/\b-?left-[\w.[\]/-]+/g, "start-*"],
  [/\b-?right-[\w.[\]/-]+/g, "end-*"],
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (/\.tsx?$/.test(entry)) files.push(full);
  }
  return files;
}

let violations = 0;

for (const searchRoot of ROOTS) {
  const absolute = join(root, searchRoot);
  let files;
  try {
    files = walk(absolute);
  } catch {
    continue;
  }

  for (const file of files) {
    const source = readFileSync(file, "utf8");

    source.split("\n").forEach((line, index) => {
      // `right-to-left`, `text-left` inside a comment, and imports are not classes.
      if (/^\s*(\/\/|\*|import)/.test(line)) return;

      for (const [pattern, replacement] of BANNED) {
        const matches = line.match(pattern);
        if (!matches) continue;

        violations++;
        console.error(
          `  ${relative(root, file)}:${index + 1}  "${matches[0]}" → use ${replacement}`,
        );
      }
    });
  }
}

if (violations > 0) {
  console.error(
    `\nFound ${violations} physical-direction utilities. This app runs in Hebrew (RTL) and English (LTR);` +
      `\nphysical directions break in exactly one of them. Use the logical equivalent.\n`,
  );
  process.exit(1);
}

console.log("Logical-properties check passed: no physical-direction utilities.");
