/** Format a number with commas for thousands (e.g. 1234.56 → "1,234.56") */
export function formatWithCommas(n: number, decimals = 2): string {
  return n.toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a fractional odds string with commas (e.g. "1000/1" stays, but decimal part gets commas) */
export function formatOddsString(odds: string): string {
  // For fractional like "1000/1", format each part
  if (odds.includes("/")) {
    const [num, den] = odds.split("/");
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (!isNaN(n) && !isNaN(d)) {
      const fmtNum = n >= 1000 ? n.toLocaleString("en-GB") : num;
      const fmtDen = d >= 1000 ? d.toLocaleString("en-GB") : den;
      return `${fmtNum}/${fmtDen}`;
    }
  }
  // For decimal string like "1234.56"
  const n = parseFloat(odds);
  if (!isNaN(n) && n >= 1000) return formatWithCommas(n);
  return odds;
}

/** Convert fractional odds string (e.g. "9/4" or "5") to decimal (e.g. 3.25 or 6.00) */
export function toDecimalOdds(odds: string): string {
  const str = odds.trim();
  const parts = str.split("/");
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return formatWithCommas(num / den + 1);
    }
  }
  const n = parseFloat(str);
  if (!isNaN(n)) return formatWithCommas(n + 1);
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
