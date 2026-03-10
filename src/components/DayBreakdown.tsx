"use client";

import { useState } from "react";
import Link from "next/link";
import { PlayerStanding } from "@/lib/leaderboard";
import { formatWithCommas } from "@/lib/scoring";

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

/** Convert decimal odds (e.g. 4.0) to fractional string (e.g. "3/1") */
function decimalToFractional(decimal: number): string {
  const fractional = decimal - 1;
  // Common fractions lookup for clean display
  const common: [number, string][] = [
    [0.2, "1/5"], [0.25, "1/4"], [0.33, "1/3"], [0.4, "2/5"], [0.5, "1/2"],
    [0.67, "2/3"], [0.8, "4/5"], [1, "1/1"], [1.2, "6/5"], [1.25, "5/4"],
    [1.33, "4/3"], [1.4, "7/5"], [1.5, "3/2"], [1.6, "8/5"], [1.67, "5/3"],
    [1.8, "9/5"], [2, "2/1"], [2.25, "9/4"], [2.5, "5/2"], [2.75, "11/4"],
    [3, "3/1"], [3.5, "7/2"], [4, "4/1"], [4.5, "9/2"], [5, "5/1"],
    [5.5, "11/2"], [6, "6/1"], [7, "7/1"], [7.5, "15/2"], [8, "8/1"],
    [9, "9/1"], [10, "10/1"], [11, "11/1"], [12, "12/1"], [14, "14/1"],
    [16, "16/1"], [20, "20/1"], [25, "25/1"], [33, "33/1"], [40, "40/1"],
    [50, "50/1"], [66, "66/1"], [100, "100/1"],
  ];
  let closest = common[0];
  let minDiff = Math.abs(fractional - closest[0]);
  for (const entry of common) {
    const diff = Math.abs(fractional - entry[0]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  if (minDiff < 0.05) {
    // Format the fractional parts with commas if large
    const [num, den] = closest[1].split("/");
    const n = parseInt(num);
    const d = parseInt(den);
    const fmtNum = n >= 1000 ? n.toLocaleString("en-GB") : num;
    const fmtDen = d >= 1000 ? d.toLocaleString("en-GB") : den;
    return `${fmtNum}/${fmtDen}`;
  }
  // Fallback: show as n/1
  if (Number.isInteger(fractional)) {
    const fmtN = fractional >= 1000 ? fractional.toLocaleString("en-GB") : String(fractional);
    return `${fmtN}/1`;
  }
  return formatWithCommas(decimal);
}

function formatOdds(sp: number, format: "decimal" | "fractional"): string {
  if (format === "decimal") return formatWithCommas(sp);
  return decimalToFractional(sp);
}

export default function DayBreakdown({
  day,
  races,
  standings,
  accaOdds,
  picksRevealed = true,
}: DayBreakdownProps) {
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional">("decimal");

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
          {/* Odds format toggle */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium">Odds:</span>
            <button
              type="button"
              onClick={() => setOddsFormat("decimal")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                oddsFormat === "decimal"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Decimal
            </button>
            <button
              type="button"
              onClick={() => setOddsFormat("fractional")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                oddsFormat === "fractional"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Fractional
            </button>
          </div>

          {/* Day standings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-lg">Day {day} Standings</h2>
              {accaOdds !== null && (
                <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  Acca: {formatOdds(accaOdds, oddsFormat)}
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
                  {formatTime(race.scheduledTime)}
                </h3>
                {race.winnerName && (
                  <div className="text-sm">
                    <span className="font-medium text-green-700">
                      {race.winnerName}
                    </span>
                    {race.winnerSP !== null && (
                      <span className="text-gray-500 ml-1">
                        ({formatOdds(race.winnerSP, oddsFormat)})
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
