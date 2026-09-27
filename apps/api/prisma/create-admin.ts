/**
 * Creates — or updates — one real administrator account, without touching any
 * other row. Unlike seed.ts, which wipes the database first, this is safe to run
 * against production.
 *
 *   DATABASE_URL=<session pooler URL> ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *     pnpm --filter @moch/api exec tsx prisma/create-admin.ts
 *
 * Optional: ADMIN_FIRST_NAME, ADMIN_LAST_NAME.
 */
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");

  const prisma = new PrismaClient();
  try {
    const ministry = await prisma.organization.findFirst({ where: { isMinistry: true } });
    const passwordHash = await argon2.hash(password);
    const firstName = process.env.ADMIN_FIRST_NAME ?? "דולב";
    const lastName = process.env.ADMIN_LAST_NAME ?? "מנהל מערכת";

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        firstName,
        lastName,
        title: "מנהל/ת מערכת",
        roles: ["EMPLOYEE", "ADMIN"],
        isActive: true,
        organizationId: ministry?.id ?? null,
      },
      // An existing account gets the new password, ADMIN, and is reactivated.
      update: { passwordHash, roles: { set: ["EMPLOYEE", "ADMIN"] }, isActive: true },
      select: { id: true, email: true, roles: true },
    });

    console.log(`Ready: ${user.email} (${user.roles.join(", ")})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
