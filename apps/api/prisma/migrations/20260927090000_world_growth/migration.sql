-- העולם שלי grows: attendance after a registration, colleague recognition
-- with a weekly limit, a profile act, avatar choices, and a department reward.
-- Additive only: new nullable columns, one index, one table.

ALTER TABLE "Registration" ADD COLUMN "attended" BOOLEAN,
ADD COLUMN "attendanceAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN "profileCompletedAt" TIMESTAMP(3);

ALTER TABLE "EmployeeWorld" ADD COLUMN "avatarBackdrop" TEXT,
ADD COLUMN "avatarOutfit" TEXT;

CREATE INDEX "Recognition_giverId_awardedAt_idx" ON "Recognition"("giverId", "awardedAt");

CREATE TABLE "DepartmentQuestReward" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "setById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentQuestReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepartmentQuestReward_departmentId_month_key" ON "DepartmentQuestReward"("departmentId", "month");

ALTER TABLE "DepartmentQuestReward" ADD CONSTRAINT "DepartmentQuestReward_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DepartmentQuestReward" ADD CONSTRAINT "DepartmentQuestReward_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
