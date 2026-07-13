/**
 * Fails the build if any file outside the admin content repository touches
 * `prisma.contentItem` for writes/lists that should go through manageableWhere.
 *
 * Reads in FeedService / HomeService / SearchService are employee or already-
 * scoped paths and are allowlisted. New admin code must use AdminContentRepository.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(process.cwd(), "apps/api/src");

const ALLOW = [
  "admin/content.repository.ts",
  "admin/search.service.ts",
  "admin/dashboard.service.ts",
  "feed/",
  "home/",
  "media/",
  "jobs/",
  "services/",
  "org/",
];

const PATTERN = /prisma\.contentItem\./g;

/** @param {string} dir @param {string[]} [out] */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith(".ts") && !name.endsWith(".spec.ts")) out.push(full);
  }
  return out;
}

/** @type {string[]} */
const offenders = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  if (ALLOW.some((prefix) => rel === prefix || rel.startsWith(prefix))) continue;
  const source = readFileSync(file, "utf8");
  if (source.match(PATTERN)) offenders.push(rel);
}

if (offenders.length > 0) {
  console.error(
    "Admin-scope check failed. These files touch prisma.contentItem outside the allowlist:",
  );
  for (const file of offenders) console.error(`  - ${file}`);
  console.error("Route admin content access through apps/api/src/admin/content.repository.ts.");
  process.exit(1);
}

console.log("Admin-scope check passed.");
