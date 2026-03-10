"use client";

import type { Runner } from "@/lib/racing-api";

interface RaceCardProps {
  runners: Runner[];
  selectedHorse: string;
  onSelect: (horseName: string) => void;
  locked: boolean;
  odds?: Record<string, string>;
}

function lbsToStLb(lbs: string): string {
  const totalLbs = parseInt(lbs, 10);
  if (isNaN(totalLbs)) return lbs;
  const st = Math.floor(totalLbs / 14);
  const lb = totalLbs % 14;
  return `${st}-${lb}`;
}

export default function RaceCard({
  runners,
  selectedHorse,
  onSelect,
  locked,
  odds = {},
}: RaceCardProps) {
  // Sort runners by odds (lowest price first), no-odds horses at the end
  const sortedRunners = [...runners].sort((a, b) => {
    const oddsA = odds[a.horse] ? parseFloat(odds[a.horse]) : Infinity;
    const oddsB = odds[b.horse] ? parseFloat(odds[b.horse]) : Infinity;
    return oddsA - oddsB;
  });

  return (
    <div className="mt-2 space-y-1.5">
      {sortedRunners.map((runner) => {
        const isSelected =
          selectedHorse.toLowerCase() === runner.horse.toLowerCase();

        return (
          <button
            key={runner.horse_id || runner.horse}
            type="button"
            disabled={locked}
            onClick={() => onSelect(runner.horse)}
            className={`w-full text-left rounded-md border p-2.5 transition-colors ${
              isSelected
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : locked
                  ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-700 shrink-0">
                    {runner.number}
                  </span>
                  <span className="font-semibold text-sm truncate">
                    {runner.horse}
                  </span>
                  {runner.draw && (
                    <span className="text-xs text-gray-400">
                      ({runner.draw})
                    </span>
                  )}
                  {runner.headgear && (
                    <span className="text-xs text-amber-600 font-medium">
                      {runner.headgear}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-gray-500 truncate">
                  <span>{runner.jockey}</span>
                  <span className="mx-1">/</span>
                  <span>{runner.trainer}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs text-gray-600">
                {odds[runner.horse] && (
                  <span className="font-semibold text-green-700 text-sm">
                    {odds[runner.horse]}
                  </span>
                )}
                {runner.form && (
                  <span className="font-mono tracking-tight">
                    {runner.form}
                  </span>
                )}
                {runner.ofr && runner.ofr !== "0" && (
                  <span title="Official Rating">
                    OR {runner.ofr}
                  </span>
                )}
                <span title="Weight">{lbsToStLb(runner.lbs)}</span>
                <span className="text-gray-400">
                  {runner.age}{runner.sex_code}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
