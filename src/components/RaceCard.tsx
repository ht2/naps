"use client";

import type { Runner } from "@/lib/racing-api";
import { formatOddsString } from "@/lib/scoring";

interface RaceCardProps {
  runners: Runner[];
  selectedHorse: string;
  onSelect: (horseName: string) => void;
  locked: boolean;
  odds?: Record<string, string>;
  decimalOdds?: Record<string, string>;
}

const COLOUR_NAMES: Record<string, string> = {
  b: "Bay", br: "Brown", ch: "Chestnut", gr: "Grey", bl: "Black", ro: "Roan",
};

const SEX_NAMES: Record<string, string> = {
  C: "Colt", F: "Filly", G: "Gelding", M: "Mare", H: "Horse",
};

const REGION_NAMES: Record<string, string> = {
  IRE: "Ireland", GB: "Great Britain", FR: "France", USA: "United States",
  GER: "Germany", ITY: "Italy", SPA: "Spain",
};

const HEADGEAR_NAMES: Record<string, string> = {
  b: "Blinkers", t: "Tongue tie", v: "Visor", h: "Hood",
  c: "Cheekpieces", e: "Eye shield", p: "Ear plugs",
};

function headgearTooltip(code: string): string {
  const parts = code.split("").map((c) => HEADGEAR_NAMES[c.toLowerCase()] ?? c);
  return `Headgear: ${parts.join(", ")}`;
}

function weightTooltip(lbs: string): string {
  const totalLbs = parseInt(lbs, 10);
  if (isNaN(totalLbs)) return `Weight: ${lbs}`;
  const st = Math.floor(totalLbs / 14);
  const lb = totalLbs % 14;
  return `Weight: ${st} stone ${lb} pounds`;
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
  decimalOdds,
}: RaceCardProps) {
  // Sort runners by decimal odds (lowest price first), no-odds horses at the end
  const sortOdds = decimalOdds ?? odds;
  const sortedRunners = [...runners].sort((a, b) => {
    const oddsA = sortOdds[a.horse] ? parseFloat(sortOdds[a.horse]) : Infinity;
    const oddsB = sortOdds[b.horse] ? parseFloat(sortOdds[b.horse]) : Infinity;
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
            {/* Row 1: Number, name, headgear | odds */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span title={`Number: ${runner.number}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-700 shrink-0">
                  {runner.number}
                </span>
                <span className="font-semibold text-sm truncate">
                  {runner.horse}
                </span>
                {runner.headgear && (
                  <span title={headgearTooltip(runner.headgear)} className="text-xs text-amber-600 font-medium">
                    {runner.headgear}
                  </span>
                )}
              </div>
              {odds[runner.horse] && (
                <span title={`Odds: ${formatOddsString(odds[runner.horse])}`} className="font-semibold text-green-700 text-sm shrink-0">
                  {formatOddsString(odds[runner.horse])}
                </span>
              )}
            </div>

            {/* Row 2: Jockey / Trainer / Owner */}
            <div className="mt-0.5 text-xs text-gray-500 truncate">
              <span title={`Jockey: ${runner.jockey}`}>{runner.jockey}</span>
              <span className="mx-1">/</span>
              <span title={`Trainer: ${runner.trainer}`}>{runner.trainer}</span>
              {runner.owner && (
                <>
                  <span className="mx-1">/</span>
                  <span title={`Owner: ${runner.owner}`} className="text-gray-400">{runner.owner}</span>
                </>
              )}
            </div>

            {/* Row 3: Stats */}
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {runner.form && (
                <span title={`Form: ${runner.form}`} className="font-mono tracking-tight">
                  {runner.form}
                </span>
              )}
              {runner.ofr && runner.ofr !== "0" && (
                <span title={`Official Rating: ${runner.ofr}`}>
                  OR {runner.ofr}
                </span>
              )}
              <span title={weightTooltip(runner.lbs)}>
                {lbsToStLb(runner.lbs)}
              </span>
              <span title={`Age/Sex: ${runner.age}-year-old ${SEX_NAMES[runner.sex_code] ?? runner.sex_code}`}>
                {runner.age}{runner.sex_code}
              </span>
              {runner.colour && (
                <span title={`Colour: ${COLOUR_NAMES[runner.colour.toLowerCase()] ?? runner.colour}`} className="uppercase">
                  {runner.colour}
                </span>
              )}
              {runner.region && (
                <span title={`Region: ${REGION_NAMES[runner.region] ?? runner.region}`}>
                  {runner.region}
                </span>
              )}
              {runner.last_run && runner.last_run !== "0" && (
                <span title={`Last run: ${runner.last_run} days ago`}>
                  {runner.last_run}d
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
