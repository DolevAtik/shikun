-- Performance indexes for Home, Feed, and admin range queries.

CREATE INDEX IF NOT EXISTS "User_isActive_birthday_idx" ON "User"("isActive", "birthday");

CREATE INDEX IF NOT EXISTS "EventDetail_startsAt_idx" ON "EventDetail"("startsAt");

CREATE INDEX IF NOT EXISTS "TrainingDetail_startsAt_idx" ON "TrainingDetail"("startsAt");

CREATE INDEX IF NOT EXISTS "Comment_contentItemId_createdAt_idx" ON "Comment"("contentItemId", "createdAt");

CREATE INDEX IF NOT EXISTS "Interaction_createdAt_idx" ON "Interaction"("createdAt");

CREATE INDEX IF NOT EXISTS "Registration_createdAt_idx" ON "Registration"("createdAt");

-- Audience array filters use `has` / `hasSome` — GIN makes those viable at scale.
CREATE INDEX IF NOT EXISTS "ContentItem_audDepartmentIds_idx" ON "ContentItem" USING GIN ("audDepartmentIds");

CREATE INDEX IF NOT EXISTS "ContentItem_audDistrictIds_idx" ON "ContentItem" USING GIN ("audDistrictIds");

CREATE INDEX IF NOT EXISTS "ContentItem_audOrganizationIds_idx" ON "ContentItem" USING GIN ("audOrganizationIds");

CREATE INDEX IF NOT EXISTS "ContentItem_audRoles_idx" ON "ContentItem" USING GIN ("audRoles");
