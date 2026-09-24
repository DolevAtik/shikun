-- The return loop for העולם שלי: a chosen world, a streak with one grace
-- day, and this week's three stamps. No employee ranking lives here.

CREATE TABLE "EmployeeWorld" (
    "userId" TEXT NOT NULL,
    "chosenWorld" TEXT,
    "streakDays" INTEGER NOT NULL DEFAULT 3,
    "graceAvailable" BOOLEAN NOT NULL DEFAULT true,
    "weeklyFilled" INTEGER NOT NULL DEFAULT 2,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "lastActOn" TIMESTAMP(3),
    "bonusXp" INTEGER NOT NULL DEFAULT 0,
    "pulsePending" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeWorld_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "EmployeeWorld" ADD CONSTRAINT "EmployeeWorld_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
