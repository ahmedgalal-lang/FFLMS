-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: seed existing categories with a sequential order (oldest first)
-- so the new sort key doesn't collapse every existing category to the same
-- position.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "Category"
)
UPDATE "Category"
SET "order" = ranked.rn
FROM ranked
WHERE "Category"."id" = ranked."id";
