/** Convert fractional odds string (e.g. "9/4" or "5") to decimal (e.g. 3.25 or 6.00) */
export function toDecimalOdds(odds: string): string {
  const str = odds.trim();
  const parts = str.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return (num / den + 1).toFixed(2);
    }
  }
  const n = parseFloat(str);
  if (!isNaN(n)) return (n + 1).toFixed(2);
  return str;
}

export function calcPickPnl(
  pick: { isNap: boolean; horseName: string },
  race: { winnerName: string | null; winnerSP: number | null }
) {
  const stake = pick.isNap ? 3 : 1;
  if (!race.winnerName || race.winnerSP === null)
    return { stake, winnings: 0, pnl: 0 };
  const won =
    pick.horseName.toLowerCase().trim() ===
    race.winnerName.toLowerCase().trim();
  const winnings = won ? stake * race.winnerSP : 0;
  return { stake, winnings, pnl: winnings - stake };
}
