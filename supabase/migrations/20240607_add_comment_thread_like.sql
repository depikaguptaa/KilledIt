-- Add parentId to Comment  (uuid, self-reference)
ALTER TABLE "Comment"
  ADD COLUMN IF NOT EXISTS "parentId" uuid
  REFERENCES "Comment"(id) ON DELETE CASCADE;

-- Add commentId to Reaction (uuid, FK → Comment)
ALTER TABLE "Reaction"
  ADD COLUMN IF NOT EXISTS "commentId" uuid
  REFERENCES "Comment"(id) ON DELETE CASCADE;

-- Each user can only ❤️ a given comment once
ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS reaction_unique_comment_like;
ALTER TABLE "Reaction" ADD CONSTRAINT reaction_unique_comment_like UNIQUE ("userId", "commentId", "type");

-- Either obituaryId OR commentId must be set
ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS reaction_target_check;
ALTER TABLE "Reaction" ADD CONSTRAINT reaction_target_check CHECK (("obituaryId" IS NOT NULL AND "commentId" IS NULL) OR ("commentId" IS NOT NULL));

----------------------------------------------------------------
-- RLS policies (skip if you already have equivalent ones)
----------------------------------------------------------------
DROP POLICY IF EXISTS "insert_reaction" ON "public"."Reaction";
CREATE POLICY "insert_reaction" ON "public"."Reaction"
  FOR INSERT WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "select_reaction" ON "public"."Reaction";
CREATE POLICY "select_reaction" ON "public"."Reaction"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "delete_own_reaction" ON "public"."Reaction";
CREATE POLICY "delete_own_reaction" ON "public"."Reaction"
  FOR DELETE USING (auth.uid() = "userId");