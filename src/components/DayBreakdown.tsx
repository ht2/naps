import Link from "next/link";
import { PlayerStanding } from "@/lib/leaderboard";

interface RaceInfo {
  id: string;
  day: number;
  raceNumber: number;
  scheduledTime: Date;
  winnerName: string | null;
  winnerSP: number | null;
}

interface DayBreakdownProps {
  day: number;
  races: RaceInfo[];
  standings: PlayerStanding[];
  accaOdds: number | null;
  picksRevealed?: boolean;
}

function formatPnl(value: number): string {
  if (value === 0) return "0.00";
  return (value > 0 ? "+" : "") + value.toFixed(2);
}

function pnlColor(value: number): string {
  if (value > 0) return "text-green-600 font-semibold";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DayBreakdown({
  day,
  races,
  standings,
  accaOdds,
  picksRevealed = true,
}: DayBreakdownProps) {
  const dayRaces = races
    .filter((r) => r.day === day)
    .sort((a, b) => a.raceNumber - b.raceNumber);

  // Sort standings by day P&L
  const dayStandings = [...standings]
    .map((s) => ({
      ...s,
      dayTotal: s.dayPnl[day] ?? 0,
      dayWins: s.dayWinners[day] ?? 0,
    }))
    .sort((a, b) => b.dayTotal - a.dayTotal);

  return (
    <div className="space-y-6">
      {!picksRevealed ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500">
            Picks for Day {day} have not been revealed yet.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            The admin will reveal picks once all selections are in.
          </p>
        </div>
      ) : (
        <>
          {/* Day standings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-lg">Day {day} Standings</h2>
              {accaOdds !== null && (
                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  Acca: {accaOdds.toFixed(1)}/1
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left bg-gray-50">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Player</th>
                    <th className="py-2 px-3 text-right">P&L</th>
                    <th className="py-2 px-3 text-right">W</th>
                  </tr>
                </thead>
                <tbody>
                  {dayStandings.map((player, idx) => {
                    const isLeader = idx === 0 && player.dayTotal > 0;
                    return (
                      <tr
                        key={player.id}
                        className={`border-b border-gray-100 ${isLeader ? "bg-yellow-50" : ""}`}
                      >
                        <td className="py-2 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium">{player.name}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${pnlColor(player.dayTotal)}`}
                        >
                          {formatPnl(player.dayTotal)}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-600">
                          {player.dayWins}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Race-by-race breakdown */}
          {dayRaces.map((race) => {
        const racePicks = standings
          .flatMap((s) =>
            s.picks
              .filter((p) => p.raceId === race.id)
              .map((p) => ({
                playerName: s.name,
                playerId: s.id,
                ...p,
              }))
          )
          .sort((a, b) => b.pnl - a.pnl);

        return (
          <div
            key={race.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Race {race.raceNumber}{" "}
                  <span className="text-gray-500 font-normal text-sm">
                    {formatTime(race.scheduledTime)}
                  </span>
                </h3>
                {race.winnerName && (
                  <div className="text-sm">
                    <span className="font-medium text-green-700">
                      {race.winnerName}
                    </span>
                    {race.winnerSP !== null && (
                      <span className="text-gray-500 ml-1">
                        ({race.winnerSP}/1)
                      </span>
                    )}
                  </div>
                )}
                {!race.winnerName && (
                  <span className="text-xs text-gray-400 italic">
                    Result pending
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {racePicks.length === 0 && (
                <div className="px-4 py-3 text-gray-400 text-sm">
                  No picks for this race
                </div>
              )}
              {racePicks.map((pick) => {
                const isWinner =
                  race.winnerName !== null &&
                  pick.horseName.toLowerCase().trim() ===
                    race.winnerName.toLowerCase().trim();

                return (
                  <div
                    key={`${pick.playerId}-${pick.raceId}`}
                    className={`px-4 py-2 flex items-center justify-between text-sm ${
                      isWinner ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium w-24 truncate">
                        {pick.playerName}
                      </span>
                      <span className={isWinner ? "text-green-700 font-semibold" : ""}>
                        {pick.horseName}
                      </span>
                      {pick.isNap && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                          NAP
                        </span>
                      )}
                      {pick.isArsenalled && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                          ARS
                        </span>
                      )}
                    </div>
                    <div className={`font-mono ${pnlColor(pick.pnl)}`}>
                      {race.winnerName ? formatPnl(pick.pnl) : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
        </>
      )}

      <div className="text-center">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Back to Leaderboard
        </Link>
      </div>
    </div>
  );
}
