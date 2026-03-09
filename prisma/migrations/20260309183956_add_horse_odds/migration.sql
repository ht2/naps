-- CreateTable
CREATE TABLE "HorseOdds" (
    "id" TEXT NOT NULL,
    "raceDate" TEXT NOT NULL,
    "raceTime" TEXT NOT NULL,
    "horseName" TEXT NOT NULL,
    "odds" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HorseOdds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HorseOdds_raceDate_raceTime_idx" ON "HorseOdds"("raceDate", "raceTime");

-- CreateIndex
CREATE UNIQUE INDEX "HorseOdds_raceDate_raceTime_horseName_key" ON "HorseOdds"("raceDate", "raceTime", "horseName");
