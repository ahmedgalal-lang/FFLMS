-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "minWatchPercent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LessonProgress" ADD COLUMN     "videoWatchedSec" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VideoQuestion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "atSec" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correct" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoQuestion_lessonId_idx" ON "VideoQuestion"("lessonId");

-- AddForeignKey
ALTER TABLE "VideoQuestion" ADD CONSTRAINT "VideoQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
