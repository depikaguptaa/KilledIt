-- Migration: allow ❤️ (heart) in Reaction.type for per-comment likes

-- Drop old unnamed check constraint (Postgres auto-named). We need to discover its name first.
DO $$
DECLARE
  constr_name text;
BEGIN
  SELECT conname INTO constr_name
  FROM pg_constraint
  WHERE conrelid = '"Reaction"'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%IN%';
  IF constr_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE "Reaction" DROP CONSTRAINT '||quote_ident(constr_name);
  END IF;
END $$;

-- Recreate explicit check constraint including ❤️
ALTER TABLE "Reaction"
  ADD CONSTRAINT "Reaction_type_check"
  CHECK (type IN ('🔥','💀','😭','🤯','🧠','save','❤️')); 