"use client";

import { useActionState } from "react";
import { useState } from "react";
import { submitDayPicks } from "@/app/play/[token]/actions";
import { isBeforeDeadline } from "@/lib/validation";
import type { Runner } from "@/lib/racing-api";
import { formatOddsString } from "@/lib/scoring";
import RaceCard from "@/components/RaceCard";

interface RaceData {
  id: string;
  raceNumber: number;
  scheduledTime: string; // ISO string for client
  raceName?: string;
}

interface ExistingPick {
  raceId: string;
  horseName: string;
  isNap: boolean;
}

interface PickFormProps {
  races: RaceData[];
  existingPicks: ExistingPick[];
  playerToken: string;
  day: number;
  runnersPerRace?: Record<string, Runner[]>;
  oddsPerRace?: Record<string, Record<string, string>>;
  fractionalOddsPerRace?: Record<string, Record<string, string>>;
  oddsUpdatedAt?: string | null;
}

export default function PickForm({
  races,
  existingPicks,
  playerToken,
  day,
  runnersPerRace = {},
  oddsPerRace = {},
  fractionalOddsPerRace = {},
  oddsUpdatedAt = null,
}: PickFormProps) {
  const pickMap = new Map(existingPicks.map((p) => [p.raceId, p]));
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional">("decimal");
  const [expandedRaces, setExpandedRaces] = useState<Set<string>>(
    () => new Set()
  );

  const toggleRace = (raceId: string) => {
    setExpandedRaces((prev) => {
      const next = new Set(prev);
      if (next.has(raceId)) next.delete(raceId);
      else next.add(raceId);
      return next;
    });
  };

  const expandAll = () => setExpandedRaces(new Set(races.map((r) => r.id)));
  const collapseAll = () => setExpandedRaces(new Set());

  const [horseNames, setHorseNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const race of races) {
      initial[race.id] = pickMap.get(race.id)?.horseName ?? "";
    }
    return initial;
  });

  const [napRaceId, setNapRaceId] = useState<string>(() => {
    const napPick = existingPicks.find((p) => p.isNap);
    return napPick?.raceId ?? "";
  });

  async function handleSubmit(
    _prevState: { success: boolean; message: string } | null,
    formData: FormData
  ) {
    return submitDayPicks(formData);
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  const now = new Date();
  const hasEditableRaces = races.some(
    (r) => new Date(r.scheduledTime) > now
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="playerToken" value={playerToken} />
      <input type="hidden" name="day" value={day} />
      <input type="hidden" name="napRaceId" value={napRaceId} />

      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
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
        {oddsUpdatedAt && (
          <span className="text-xs text-gray-400">
            Odds last updated at {new Date(oddsUpdatedAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <details className="mb-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
        <summary className="px-4 py-2.5 cursor-pointer font-medium text-gray-600 hover:text-gray-800">
          Race card legend
        </summary>
        <div className="px-4 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-600">
          <div>
            <p className="font-semibold text-gray-700 mb-1">Sex codes</p>
            <ul className="space-y-0.5">
              <li><span className="font-mono font-bold w-4 inline-block">C</span> Colt (young male)</li>
              <li><span className="font-mono font-bold w-4 inline-block">F</span> Filly (young female)</li>
              <li><span className="font-mono font-bold w-4 inline-block">G</span> Gelding (castrated male)</li>
              <li><span className="font-mono font-bold w-4 inline-block">M</span> Mare (older female, 5+)</li>
              <li><span className="font-mono font-bold w-4 inline-block">H</span> Horse (older entire male, 5+)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">Headgear</p>
            <ul className="space-y-0.5">
              <li><span className="font-mono font-bold w-4 inline-block">b</span> Blinkers</li>
              <li><span className="font-mono font-bold w-4 inline-block">t</span> Tongue tie</li>
              <li><span className="font-mono font-bold w-4 inline-block">v</span> Visor</li>
              <li><span className="font-mono font-bold w-4 inline-block">h</span> Hood</li>
              <li><span className="font-mono font-bold w-4 inline-block">c</span> Cheekpieces</li>
              <li><span className="font-mono font-bold w-4 inline-block">e</span> Eye shield</li>
              <li><span className="font-mono font-bold w-4 inline-block">p</span> Ear plugs</li>
            </ul>
          </div>
          <div className="sm:col-span-2 mt-1 pt-1 border-t border-gray-200">
            <p className="font-semibold text-gray-700 mb-1">Other fields</p>
            <ul className="space-y-0.5">
              <li><span className="font-semibold">Age/Sex</span> — Combined age and sex code, e.g. <span className="font-mono">7G</span> = 7-year-old Gelding, <span className="font-mono">5M</span> = 5-year-old Mare</li>
              <li><span className="font-semibold">Form</span> — Recent finishing positions (1=won, 0=10th+, F=fell, P=pulled up, U=unseated, -=break between seasons)</li>
              <li><span className="font-semibold">OR</span> — Official Rating (higher = better, used for handicaps)</li>
              <li><span className="font-semibold">Weight</span> — Carried weight in stones-pounds (e.g. 11-4 = 11st 4lb)</li>
              <li><span className="font-semibold">Colour</span> — Coat colour: B=bay, CH=chestnut, GR=grey, BL=black, BR=brown, RO=roan</li>
              <li><span className="font-semibold">Region</span> — Country of origin (e.g. IRE, GB, FR)</li>
              <li><span className="font-semibold">Owner</span> — Shown after jockey/trainer</li>
              <li><span className="font-semibold">Days since last run</span> — Number followed by &quot;d&quot;, e.g. <span className="font-mono">59d</span> = 59 days since last race</li>
            </ul>
          </div>
        </div>
      </details>

      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={expandedRaces.size === races.length ? collapseAll : expandAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {expandedRaces.size === races.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="space-y-4">
        {races.map((race) => {
          const existing = pickMap.get(race.id);
          const raceTime = new Date(race.scheduledTime);
          const locked = !isBeforeDeadline(raceTime);
          const runners = runnersPerRace[race.id];
          const hasRunners = runners && runners.length > 0;
          const isExpanded = expandedRaces.has(race.id);
          const selectedHorse = horseNames[race.id] ?? "";
          const isNap = napRaceId === race.id;

          return (
            <div
              key={race.id}
              className={`rounded-lg border ${
                locked
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Header — always visible, clickable to toggle */}
              <button
                type="button"
                onClick={() => toggleRace(race.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold">
                      {raceTime.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </h3>
                    {race.raceName && (
                      <p className="text-xs text-gray-500 truncate">{race.raceName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {locked && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        Locked
                      </span>
                    )}
                    <span className="text-gray-400 text-xs">
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </span>
                  </div>
                </div>
                {!isExpanded && (selectedHorse || isNap) && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                    {selectedHorse && (
                      <span className="text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                        {selectedHorse}
                      </span>
                    )}
                    {selectedHorse && oddsPerRace[race.id]?.[selectedHorse] && (
                      <span className="text-sm font-semibold text-green-700">
                        {formatOddsString(oddsFormat === "decimal"
                          ? oddsPerRace[race.id][selectedHorse]
                          : fractionalOddsPerRace[race.id]?.[selectedHorse] ?? oddsPerRace[race.id][selectedHorse])}
                      </span>
                    )}
                    {isNap && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                        NAP
                      </span>
                    )}
                  </div>
                )}
              </button>

              {/* Collapsible body */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  {hasRunners ? (
                    <>
                      <input
                        type="hidden"
                        name={`horse_${race.id}`}
                        value={selectedHorse}
                      />
                      <RaceCard
                        runners={runners}
                        selectedHorse={selectedHorse}
                        onSelect={(horseName) =>
                          setHorseNames((prev) => ({
                            ...prev,
                            [race.id]: horseName,
                          }))
                        }
                        locked={locked}
                        odds={oddsFormat === "decimal" ? oddsPerRace[race.id] : fractionalOddsPerRace[race.id]}
                        decimalOdds={oddsPerRace[race.id]}
                      />
                      {!locked && (
                        <div className="mt-2">
                          <input
                            type="text"
                            id={`horse-${race.id}`}
                            value={selectedHorse}
                            onChange={(e) =>
                              setHorseNames((prev) => ({
                                ...prev,
                                [race.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Or type horse name manually"
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label
                          htmlFor={`horse-${race.id}`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Horse name
                        </label>
                        {locked ? (
                          <p className="text-sm py-2 px-3 bg-gray-200 rounded-md">
                            {existing?.horseName || (
                              <span className="text-gray-400 italic">No pick</span>
                            )}
                          </p>
                        ) : (
                          <input
                            type="text"
                            id={`horse-${race.id}`}
                            name={`horse_${race.id}`}
                            value={selectedHorse}
                            onChange={(e) =>
                              setHorseNames((prev) => ({
                                ...prev,
                                [race.id]: e.target.value,
                              }))
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Enter horse name"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-end mt-3">
                    <label
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                        isNap
                          ? "bg-amber-100 border-amber-400 text-amber-800"
                          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                      } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <input
                        type="radio"
                        name="napRaceId"
                        value={race.id}
                        checked={isNap}
                        onChange={() => {
                          if (!locked) setNapRaceId(race.id);
                        }}
                        disabled={locked && !isNap}
                        className="accent-amber-600"
                      />
                      <span className="text-sm font-medium">NAP</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Hidden inputs still need to submit when collapsed */}
              {!isExpanded && hasRunners && (
                <input
                  type="hidden"
                  name={`horse_${race.id}`}
                  value={selectedHorse}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={expandedRaces.size === races.length ? collapseAll : expandAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {expandedRaces.size === races.length ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {state && (
        <div
          className={`mt-4 p-3 rounded-md text-sm ${
            state.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      {hasEditableRaces && (
        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save Picks"}
        </button>
      )}
    </form>
  );
}
