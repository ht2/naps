-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "entryFee" INTEGER NOT NULL DEFAULT 10,
    "adminPasswordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "competitionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "raceNumber" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "winnerName" TEXT,
    "winnerSP" DOUBLE PRECISION,
    "competitionId" TEXT NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pick" (
    "id" TEXT NOT NULL,
    "horseName" TEXT NOT NULL,
    "isNap" BOOLEAN NOT NULL DEFAULT false,
    "isArsenalled" BOOLEAN NOT NULL DEFAULT false,
    "playerId" TEXT NOT NULL,
    "raceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_token_key" ON "Player"("token");

-- CreateIndex
CREATE INDEX "Player_competitionId_idx" ON "Player"("competitionId");

-- CreateIndex
CREATE INDEX "Race_competitionId_idx" ON "Race"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Race_competitionId_day_raceNumber_key" ON "Race"("competitionId", "day", "raceNumber");

-- CreateIndex
CREATE INDEX "Pick_raceId_idx" ON "Pick"("raceId");

-- CreateIndex
CREATE INDEX "Pick_playerId_idx" ON "Pick"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Pick_playerId_raceId_key" ON "Pick"("playerId", "raceId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
