"use client";

import { calcPickPnl } from "@/lib/scoring";
import { arsenalPlayer } from "@/app/admin/(protected)/race/actions";

interface Pick {
  id: string;
  horseName: string;
  isNap: boolean;
  isArsenalled: boolean;
  player: { id: string; name: string };
}

interface Race {
  id: string;
  winnerName: string | null;
  winnerSP: number | null;
}

interface PlayerPicksTableProps {
  picks: Pick[];
  race: Race;
  allPlayers: { id: string; name: string }[];
}

export default function PlayerPicksTable({
  picks,
  race,
  allPlayers,
}: PlayerPicksTableProps) {
  const pickedPlayerIds = new Set(picks.map((p) => p.player.id));
  const missingPlayers = allPlayers.filter((p) => !pickedPlayerIds.has(p.id));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Player</th>
              <th className="text-left px-4 py-3 font-medium">Horse</th>
              <th className="text-center px-4 py-3 font-medium">NAP?</th>
              <th className="text-center px-4 py-3 font-medium">Arsenalled?</th>
              <th className="text-right px-4 py-3 font-medium">P&amp;L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {picks.map((pick) => {
              const { pnl } = calcPickPnl(pick, race);
              const isWinner =
                race.winnerName &&
                pick.horseName.toLowerCase().trim() ===
                  race.winnerName.toLowerCase().trim();

              return (
                <tr
                  key={pick.id}
                  className={isWinner ? "bg-green-50" : ""}
                >
                  <td className={`px-4 py-3 ${pick.isNap ? "font-bold" : ""}`}>
                    {pick.player.name}
                  </td>
                  <td className={`px-4 py-3 ${pick.isNap ? "font-bold" : ""}`}>
                    {pick.horseName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pick.isNap ? "Yes" : ""}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pick.isArsenalled ? "Yes" : ""}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono ${
                      pnl > 0
                        ? "text-green-600"
                        : pnl < 0
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {race.winnerName ? (pnl >= 0 ? "+" : "") + pnl.toFixed(2) : "—"}
                  </td>
                </tr>
              );
            })}
            {picks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No picks submitted for this race yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {missingPlayers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-3">
            Missing Picks — Arsenal Candidates
          </h3>
          <div className="space-y-3">
            {missingPlayers.map((player) => (
              <form
                key={player.id}
                action={arsenalPlayer}
                className="flex items-center gap-3"
              >
                <input type="hidden" name="playerId" value={player.id} />
                <input type="hidden" name="raceId" value={race.id} />
                <span className="text-sm font-medium text-yellow-900 w-32">
                  {player.name}
                </span>
                <input
                  type="text"
                  name="horseName"
                  required
                  placeholder="Favourite name"
                  className="border border-yellow-300 rounded-md px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  type="submit"
                  className="bg-yellow-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                >
                  Arsenal
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
