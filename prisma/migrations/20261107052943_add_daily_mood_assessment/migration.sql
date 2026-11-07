-- CreateTable
CREATE TABLE "DailyMoodAssessment" (
    "id" TEXT NOT NULL,
    "assessmentDate" DATE NOT NULL,
    "answers" JSONB NOT NULL,
    "mood" INTEGER NOT NULL,
    "emotion" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DailyMoodAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyMoodAssessment_userId_createdAt_idx" ON "DailyMoodAssessment"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMoodAssessment_userId_assessmentDate_key" ON "DailyMoodAssessment"("userId", "assessmentDate");

-- AddForeignKey
ALTER TABLE "DailyMoodAssessment" ADD CONSTRAINT "DailyMoodAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
