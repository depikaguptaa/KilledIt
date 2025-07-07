-- Migration: allow NULL obituaryId in Reaction for comment-level likes

-- Drop NOT NULL on obituaryId so rows that target a comment only can omit obituaryId
ALTER TABLE "Reaction"
  ALTER COLUMN "obituaryId" DROP NOT NULL; 