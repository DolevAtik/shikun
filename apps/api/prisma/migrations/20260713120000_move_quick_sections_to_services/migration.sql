-- Quick actions and quick links now live on the Services screen, which reads the
-- QuickAction and QuickLink tables directly. They are no longer section types
-- Home knows how to render, so the layout rows that placed them there go away
-- with the enum values. The QuickAction and QuickLink rows themselves are
-- untouched — this moves where they are shown, not what they are.

DELETE FROM "HomeSectionConfig" WHERE "type" IN ('QUICK_ACTIONS', 'QUICK_LINKS');

-- AlterEnum
BEGIN;
CREATE TYPE "HomeSectionType_new" AS ENUM ('GREETING', 'EMERGENCY', 'ANNOUNCEMENTS', 'WEEKLY_SUMMARY', 'EVENTS', 'CEO_MESSAGE', 'VIDEO_OF_WEEK', 'PROJECTS', 'KEY_NUMBERS', 'CAREERS', 'TRAININGS', 'BIRTHDAYS', 'RECOGNITION');
ALTER TABLE "HomeSectionConfig" ALTER COLUMN "type" TYPE "HomeSectionType_new" USING ("type"::text::"HomeSectionType_new");
ALTER TYPE "HomeSectionType" RENAME TO "HomeSectionType_old";
ALTER TYPE "HomeSectionType_new" RENAME TO "HomeSectionType";
DROP TYPE "HomeSectionType_old";
COMMIT;
