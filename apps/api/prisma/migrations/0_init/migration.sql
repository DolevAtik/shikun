-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'DISTRICT_MANAGER', 'CONTENT_EDITOR', 'HR', 'EXECUTIVE', 'ADMIN');

-- CreateEnum
CREATE TYPE "DistrictCode" AS ENUM ('NORTH', 'HAIFA', 'CENTER', 'JERUSALEM', 'SOUTH');

-- CreateEnum
CREATE TYPE "DepartmentKind" AS ENUM ('SENIOR_DIVISION', 'ADMINISTRATION', 'BUREAU');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('ANNOUNCEMENT', 'FEED_POST', 'EVENT', 'CAREER', 'TRAINING', 'CEO_MESSAGE', 'VIDEO', 'ALERT');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'BOOKMARK');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'MARKETING', 'BUILDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TrainingFormat" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');

-- CreateEnum
CREATE TYPE "BadgeKey" AS ENUM ('COMMUNITY_CONTRIBUTOR', 'INNOVATION_CHAMPION', 'KNOWLEDGE_SHARER', 'DISTRICT_AMBASSADOR', 'VOLUNTEER', 'MENTOR', 'TOP_CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "HomeSectionType" AS ENUM ('GREETING', 'EMERGENCY', 'ANNOUNCEMENTS', 'WEEKLY_SUMMARY', 'EVENTS', 'CEO_MESSAGE', 'VIDEO_OF_WEEK', 'PROJECTS', 'KEY_NUMBERS', 'CAREERS', 'TRAININGS', 'QUICK_ACTIONS', 'BIRTHDAYS', 'RECOGNITION', 'QUICK_LINKS');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameHe" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isMinistry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "code" "DistrictCode" NOT NULL,
    "nameHe" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "DepartmentKind" NOT NULL,
    "nameHe" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "birthday" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'he',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roles" "Role"[] DEFAULT ARRAY['EMPLOYEE']::"Role"[],
    "departmentId" TEXT,
    "districtId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "title" TEXT,
    "body" TEXT,
    "authorId" TEXT,
    "districtId" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "audDepartmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audDistrictIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audOrganizationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audRoles" "Role"[] DEFAULT ARRAY[]::"Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementDetail" (
    "contentItemId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "imageUrl" TEXT,

    CONSTRAINT "AnnouncementDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "FeedPostDetail" (
    "contentItemId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,

    CONSTRAINT "FeedPostDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "EventDetail" (
    "contentItemId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "capacity" INTEGER,

    CONSTRAINT "EventDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "CareerDetail" (
    "contentItemId" TEXT NOT NULL,
    "departmentId" TEXT,
    "closesAt" TIMESTAMP(3),
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "href" TEXT,

    CONSTRAINT "CareerDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "TrainingDetail" (
    "contentItemId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "format" "TrainingFormat" NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "TrainingDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "VideoDetail" (
    "contentItemId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isVideoOfWeek" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VideoDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "CeoMessageDetail" (
    "contentItemId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "CeoMessageDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "AlertDetail" (
    "contentItemId" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
    "href" TEXT,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AlertDetail_pkey" PRIMARY KEY ("contentItemId")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameHe" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionHe" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT,
    "kind" "MediaKind" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "alt" TEXT,
    "fileName" TEXT,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "districtId" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "housingUnits" INTEGER,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "changePct" DOUBLE PRECISION,
    "period" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickLink" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuickLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickAction" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuickAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recognition" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "giverId" TEXT,
    "badge" "BadgeKey" NOT NULL,
    "reason" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklySummary" (
    "id" TEXT NOT NULL,
    "weekOf" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "teaser" TEXT NOT NULL,
    "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklySummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSectionConfig" (
    "id" TEXT NOT NULL,
    "type" "HomeSectionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxItems" INTEGER,
    "audDepartmentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audDistrictIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audOrganizationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "audRoles" "Role"[] DEFAULT ARRAY[]::"Role"[],

    CONSTRAINT "HomeSectionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ContentTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ContentTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "District_code_key" ON "District"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_districtId_idx" ON "User"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "ContentItem_kind_status_publishedAt_idx" ON "ContentItem"("kind", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "ContentItem_districtId_idx" ON "ContentItem"("districtId");

-- CreateIndex
CREATE INDEX "FeedPostDetail_channelId_idx" ON "FeedPostDetail"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_slug_key" ON "Channel"("slug");

-- CreateIndex
CREATE INDEX "Follow_userId_idx" ON "Follow"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_userId_channelId_key" ON "Follow"("userId", "channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "Media_contentItemId_idx" ON "Media"("contentItemId");

-- CreateIndex
CREATE INDEX "Interaction_contentItemId_type_idx" ON "Interaction"("contentItemId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Interaction_userId_contentItemId_type_key" ON "Interaction"("userId", "contentItemId", "type");

-- CreateIndex
CREATE INDEX "Comment_contentItemId_idx" ON "Comment"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE INDEX "Registration_contentItemId_idx" ON "Registration"("contentItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_userId_contentItemId_key" ON "Registration"("userId", "contentItemId");

-- CreateIndex
CREATE INDEX "Project_districtId_idx" ON "Project"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "KeyMetric_key_key" ON "KeyMetric"("key");

-- CreateIndex
CREATE INDEX "Recognition_recipientId_idx" ON "Recognition"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklySummary_weekOf_key" ON "WeeklySummary"("weekOf");

-- CreateIndex
CREATE INDEX "HomeSectionConfig_order_idx" ON "HomeSectionConfig"("order");

-- CreateIndex
CREATE INDEX "_ContentTags_B_index" ON "_ContentTags"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementDetail" ADD CONSTRAINT "AnnouncementDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPostDetail" ADD CONSTRAINT "FeedPostDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPostDetail" ADD CONSTRAINT "FeedPostDetail_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDetail" ADD CONSTRAINT "EventDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerDetail" ADD CONSTRAINT "CareerDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerDetail" ADD CONSTRAINT "CareerDetail_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDetail" ADD CONSTRAINT "TrainingDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDetail" ADD CONSTRAINT "VideoDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CeoMessageDetail" ADD CONSTRAINT "CeoMessageDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertDetail" ADD CONSTRAINT "AlertDetail_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interaction" ADD CONSTRAINT "Interaction_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recognition" ADD CONSTRAINT "Recognition_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recognition" ADD CONSTRAINT "Recognition_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentTags" ADD CONSTRAINT "_ContentTags_A_fkey" FOREIGN KEY ("A") REFERENCES "ContentItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentTags" ADD CONSTRAINT "_ContentTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

