import { prisma } from "./prisma";
import { calcPickPnl } from "./scoring";

export interface PlayerStanding {
  id: string;
  name: string;
  paid: boolean;
  overallPnl: number;
  dayPnl: Record<number, number>;
  totalWinners: number;
  dayWinners: Record<number, number>;
  picks: Array<{
    raceId: string;
    horseName: string;
    isNap: boolean;
    isArsenalled: boolean;
    day: number;
    raceNumber: number;
    pnl: number;
    stake: number;
    winnings: number;
  }>;
}

export async function getActiveCompetition() {
  return prisma.competition.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeaderboard(competitionId: string): Promise<{
  standings: PlayerStanding[];
  accaOdds: Record<number, number>;
  races: Array<{
    id: string;
    day: number;
    raceNumber: number;
    scheduledTime: Date;
    winnerName: string | null;
    winnerSP: number | null;
  }>;
  competition: {
    name: string;
    year: number;
    entryFee: number;
    startDate: Date;
  } | null;
}> {
  const [competition, players, races] = await Promise.all([
    prisma.competition.findUnique({
      where: { id: competitionId },
      select: { name: true, year: true, entryFee: true, startDate: true },
    }),
    prisma.player.findMany({
      where: { competitionId },
      include: {
        picks: {
          include: { race: true },
        },
      },
    }),
    prisma.race.findMany({
      where: { competitionId },
      orderBy: [{ day: "asc" }, { raceNumber: "asc" }],
    }),
  ]);

  // Build a race lookup
  const raceMap = new Map(races.map((r) => [r.id, r]));

  // Figure out which days have all 7 results in
  const dayRaceCounts: Record<number, number> = {};
  const dayResultCounts: Record<number, number> = {};
  const dayWinnerSPs: Record<number, number[]> = {};

  for (const race of races) {
    dayRaceCounts[race.day] = (dayRaceCounts[race.day] || 0) + 1;
    if (race.winnerName && race.winnerSP !== null) {
      dayResultCounts[race.day] = (dayResultCounts[race.day] || 0) + 1;
      if (!dayWinnerSPs[race.day]) dayWinnerSPs[race.day] = [];
      dayWinnerSPs[race.day].push(race.winnerSP);
    }
  }

  // Acca odds: product of all winner SPs for days where all 7 results are in
  const accaOdds: Record<number, number> = {};
  for (const [dayStr, count] of Object.entries(dayRaceCounts)) {
    const day = Number(dayStr);
    if (dayResultCounts[day] === count && dayWinnerSPs[day]) {
      accaOdds[day] = dayWinnerSPs[day].reduce((acc, sp) => acc * sp, 1);
    }
  }

  // Compute standings
  const standings: PlayerStanding[] = players.map((player) => {
    const dayPnl: Record<number, number> = {};
    const dayWinners: Record<number, number> = {};
    let overallPnl = 0;
    let totalWinners = 0;

    const picks = player.picks.map((pick) => {
      const race = raceMap.get(pick.raceId)!;
      const { stake, winnings, pnl } = calcPickPnl(pick, race);
      const won =
        race.winnerName !== null &&
        pick.horseName.toLowerCase().trim() ===
          race.winnerName.toLowerCase().trim();

      dayPnl[race.day] = (dayPnl[race.day] || 0) + pnl;
      overallPnl += pnl;

      if (won) {
        dayWinners[race.day] = (dayWinners[race.day] || 0) + 1;
        totalWinners += 1;
      }

      return {
        raceId: pick.raceId,
        horseName: pick.horseName,
        isNap: pick.isNap,
        isArsenalled: pick.isArsenalled,
        day: race.day,
        raceNumber: race.raceNumber,
        pnl,
        stake,
        winnings,
      };
    });

    return {
      id: player.id,
      name: player.name,
      paid: player.paid,
      overallPnl,
      dayPnl,
      totalWinners,
      dayWinners,
      picks,
    };
  });

  // Sort by overall P&L descending
  standings.sort((a, b) => b.overallPnl - a.overallPnl);

  return {
    standings,
    accaOdds,
    races: races.map((r) => ({
      id: r.id,
      day: r.day,
      raceNumber: r.raceNumber,
      scheduledTime: r.scheduledTime,
      winnerName: r.winnerName,
      winnerSP: r.winnerSP,
    })),
    competition,
  };
}
