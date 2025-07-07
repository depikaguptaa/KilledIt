-- Migration: refine uniqueness rules on Reaction
-- Allows a user to react once per obituary (emoji/save) AND once per comment (❤️) separately

-- 1. Drop old unique constraint (on multiple columns) if it exists
ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS "Reaction_type_userId_obituaryId_key";
ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS reaction_unique_comment_like;

-- 2. Create partial unique indexes
-- one per obituary per emoji/save
CREATE UNIQUE INDEX IF NOT EXISTS reaction_user_obituary_type_unique
  ON "Reaction" ("userId", "obituaryId", type)
  WHERE "obituaryId" IS NOT NULL;

-- one per comment per type (currently only ❤️ used)
CREATE UNIQUE INDEX IF NOT EXISTS reaction_user_comment_type_unique
  ON "Reaction" ("userId", "commentId", type)
  WHERE "commentId" IS NOT NULL; 