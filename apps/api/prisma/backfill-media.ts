/**
 * Backfills the Home cover photos and the video-of-the-week link onto a
 * database that was seeded before either existed.
 *
 * This is not `db:seed`. The seed drops every table and rebuilds it, which is
 * fine for a laptop and unacceptable for the live demo — it would take the
 * users, the posts and the likes with it. This script only ever writes the
 * media columns, matching rows by the names the seed gave them, so it deletes
 * nothing and can be run twice with the same result.
 *
 *   Local:      pnpm --filter @moch/api db:backfill-media
 *   Production: DATABASE_URL="<neon url>" pnpm --filter @moch/api db:backfill-media:prod
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Same sizing as the seed: a card cover, and no larger. */
function photo(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;
}

const PROJECT_PHOTOS: Record<string, string> = {
  "התחדשות עירונית — קריית אליעזר": photo("1596541513035-630fea51dbb4"),
  "שכונת הרקפות": photo("1545324418-cc1a3fa10c00"),
  "מתחם הרכבת": photo("1433840496881-cbd845929862"),
  "פינוי-בינוי גבעת שאול": photo("1601074231509-dce351c05199"),
  "שכונת נווה מדבר": photo("1612597412360-0612edc938b1"),
  "מתחם התעשייה הישנה": photo("1460317442991-0ec209397118"),
};

const EVENT_PHOTOS: Record<string, string> = {
  "יום עיון: התחדשות עירונית 2026": photo("1540575467063-178a50c2df87"),
  "מפגש מחוזי — מחוז דרום": photo("1517245386807-bb43f82c33c4"),
  "וובינר: מה חדש במערכת הרישוי": photo("1588196749597-9ff075ee6b5b"),
};

const VIDEO = {
  title: "יש לכם כתובת! משרד הבינוי והשיכון בשבילכם",
  body: "סרטון ההסברה של המשרד — מה אנחנו עושים, ולמי זה מגיע.",
  videoUrl: "https://www.youtube.com/watch?v=ETGuwz5FRaY",
  thumbnailUrl: "https://img.youtube.com/vi/ETGuwz5FRaY/maxresdefault.jpg",
};

async function main() {
  console.log(`\nBackfilling media…\n`);

  for (const [name, imageUrl] of Object.entries(PROJECT_PHOTOS)) {
    const { count } = await prisma.project.updateMany({ where: { name }, data: { imageUrl } });
    console.log(`  project  ${count > 0 ? "updated  " : "NOT FOUND"}  ${name}`);
  }

  for (const [title, imageUrl] of Object.entries(EVENT_PHOTOS)) {
    const item = await prisma.contentItem.findFirst({ where: { kind: "EVENT", title } });
    if (!item) {
      console.log(`  event    NOT FOUND  ${title}`);
      continue;
    }
    await prisma.eventDetail.update({ where: { contentItemId: item.id }, data: { imageUrl } });
    console.log(`  event    updated    ${title}`);
  }

  const video = await prisma.videoDetail.findFirst({ where: { isVideoOfWeek: true } });
  if (video) {
    // The title travels with the URL: the row used to describe a different film
    // entirely, and a card that names one video and plays another is a lie.
    await prisma.videoDetail.update({
      where: { contentItemId: video.contentItemId },
      data: { videoUrl: VIDEO.videoUrl, thumbnailUrl: VIDEO.thumbnailUrl, durationSeconds: null },
    });
    await prisma.contentItem.update({
      where: { id: video.contentItemId },
      data: { title: VIDEO.title, body: VIDEO.body },
    });
    console.log(`  video    updated    ${VIDEO.title}`);
  } else {
    console.log("  video    NOT FOUND  (no video-of-week row)");
  }

  console.log("\nDone. Nothing was deleted.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
