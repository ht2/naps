"use client";

import { enterResult } from "@/app/admin/(protected)/race/actions";

interface RaceResultFormProps {
  raceId: string;
  currentWinnerName?: string | null;
  currentWinnerSP?: number | null;
}

export default function RaceResultForm({
  raceId,
  currentWinnerName,
  currentWinnerSP,
}: RaceResultFormProps) {
  return (
    <form action={enterResult} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        {currentWinnerName ? "Edit Result" : "Enter Result"}
      </h2>
      <input type="hidden" name="raceId" value={raceId} />
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="winnerName" className="block text-sm font-medium text-gray-700 mb-1">
            Winner Name
          </label>
          <input
            type="text"
            id="winnerName"
            name="winnerName"
            defaultValue={currentWinnerName ?? ""}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Constitution Hill"
          />
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="winnerSP" className="block text-sm font-medium text-gray-700 mb-1">
            SP Odds
          </label>
          <input
            type="number"
            id="winnerSP"
            name="winnerSP"
            step="0.01"
            min="1"
            defaultValue={currentWinnerSP ?? ""}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 3.50"
          />
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        {currentWinnerName ? "Update Result" : "Save Result"}
      </button>
    </form>
  );
}
