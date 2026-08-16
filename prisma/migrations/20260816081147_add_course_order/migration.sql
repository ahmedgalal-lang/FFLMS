-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Course_status_order_idx" ON "Course"("status", "order");

-- Backfill: seed existing courses with a sequential order (oldest first) so
-- the new sort key doesn't collapse every existing course to the same
-- position. New courses still default to 0 until explicitly reordered.
WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "Course"
)
UPDATE "Course"
SET "order" = ranked.rn
FROM ranked
WHERE "Course"."id" = ranked."id";
