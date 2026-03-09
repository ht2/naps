# NAPS Competition — Cheltenham Festival Tracker

## Game Specification (reverse-engineered from NAPS LMS 2025)

---

## 1. Overview

A NAPS competition is a horse racing tipping game played across the four days of the Cheltenham Festival. Each player picks a horse (a "nap") for every race across the festival and is scored based on whether their picks win using the starting price (SP) odds from Timeform.

The game is played for a prize pool: each player pays a £10 entry fee, and the total pot goes to the winner. **Winner takes all.**

---

## 2. Festival Structure

- **Duration:** 4 days (Tuesday to Friday of Cheltenham Festival week)
- **Races per day:** 7 races per day
- **Total races:** 28 races across the festival
- **Race times (2025 pattern):** 13:20, 14:00, 14:40, 15:20, 16:00, 16:40, 17:20

---

## 3. Entry & Players

- **Entry fee:** £10 per player
- **Payment method:** PayPal (to a designated organiser)
- **Total pot:** Number of players × £10 (e.g. 10 players = £100 pot)
- **No player limit** — the sheet had 10 players in 2025, but it should be flexible
- **Prize structure:** Winner takes all — highest overall P&L at end of Day 4 takes the entire pot

---

## 4. Core Rules — Picking Horses

### 4.1 Standard Picks (£1 stake)
- For each of the 7 races per day, every player must pick **one horse**
- Each standard pick carries a **£1 notional stake**
- This means each day costs **£9 base** (7 × £1 standard + the NAP adjustment below)

### 4.2 The NAP (£3 stake)
- Each day, every player must designate **one** of their 7 picks as their **NAP** (best bet of the day)
- The NAP pick carries a **£3 notional stake** instead of £1
- So the daily outlay is: 6 races × £1 + 1 NAP × £3 = **£9 per day**
- Over 4 days the total notional spend is **£36**
- The NAP is indicated by appending "(NAP)" after the horse name, e.g. `"Kopek Des Bordes (NAP)"`

### 4.3 Deadlines & Penalties ("Arsenalled")
- Entries **must** be submitted before each race's start time
- If a player misses the deadline for a race:
  - They are **"Arsenalled"** — automatically assigned the **race favourite** as their pick
  - If they haven't used their NAP for that day yet, the first missed race becomes their NAP (at £3 stake)
  - This is a penalty mechanism: the favourite often has poor value odds, so being Arsenalled is undesirable

---

## 5. Scoring / P&L Calculation

### 5.1 Odds Source
- Odds are expressed in **decimal format** (e.g. 4.0, 7.5, 26)
- The admin **manually enters** the winner and SP for each race after it finishes
- In 2025 the group used Timeform as a reference, but any reliable source is fine
- **Nice-to-have:** If an open API exists for race results/SPs (e.g. The Racing API, Betfair Exchange API, or similar), the app could offer auto-population — but this must always be overridable by the admin. Manual entry is the primary flow.

### 5.2 Win Calculation
For each race, per player:

```
If the player's horse WINS:
    Winnings = Stake × Winner_SP_Odds
    (e.g. £1 stake, horse wins at 6.0 → Winnings = £6.00)
    (e.g. £3 NAP stake, horse wins at 4.0 → Winnings = £12.00)

If the player's horse LOSES:
    Winnings = £0
```

### 5.3 Profit/Loss per Race

```
Race P&L = Winnings - Stake
```

Examples:
- £1 pick, horse wins at 7.5 → P&L = 7.5 - 1 = **+£6.50**
- £3 NAP, horse wins at 4.0 → P&L = 12.0 - 3 = **+£9.00**
- £1 pick, horse loses → P&L = 0 - 1 = **-£1.00**
- £3 NAP, horse loses → P&L = 0 - 3 = **-£3.00**

### 5.4 Daily Total

```
Day Total = Sum of all 7 race P&Ls for that day
```

The best possible day (if all 7 win): depends on odds.
The worst possible day: **-£9** (all 7 lose: 6 × -£1 + 1 × -£3)

### 5.5 Overall / Running Total

```
Overall = Sum of Day Totals across all days played so far
```

This is the **"Live Standings"** figure on the Entries sheet.

---

## 6. Leaderboard & Standings

### 6.1 Ranking
- Players are ranked by their **Overall P&L** (highest = best)
- Each day sheet includes a sorted leaderboard at the bottom showing:
  - Player name
  - Overall cumulative P&L
  - That day's profit/loss

### 6.2 Entries Sheet (Summary)
The main Entries sheet shows:
- Entry fee per player
- Player name
- Live Standings (overall P&L)
- Day-by-day P&L breakdown
- Total pot

---

## 7. Additional Stats (tracked per day sheet)

### 7.1 Acca Odds
- The combined accumulator odds of all 7 race winners is calculated per day
- This is just for fun/reference: `Product of all 7 Winner SPs`
- e.g. Day 1: 1.67 × 6 × 7.5 × 1.67 × 26 × 9.5 × 4.5 ≈ 139,494

### 7.2 Winner Tracking
- Each day sheet has a "Winners" row that counts how many correct picks each player had that day
- A "Total Winners" row tracks cumulative correct picks across the festival

---

## 8. Data Model

### 8.1 Player
```
{
  id: string
  name: string
  entryFee: 10
  dailyPnL: { day1: number, day2: number, day3: number, day4: number }
  overallPnL: number
}
```

### 8.2 Race
```
{
  day: 1-4
  raceNumber: 1-7
  time: string (e.g. "13:20")
  winner: string | null       // filled in after the race
  winnerSP: number | null     // decimal odds, filled in after the race
}
```

### 8.3 Pick
```
{
  playerId: string
  raceDay: 1-4
  raceNumber: 1-7
  horseName: string
  isNap: boolean
  stake: 1 | 3               // derived from isNap
  winnings: number            // 0 if lost, stake × SP if won
  pnl: number                // winnings - stake
}
```

---

## 9. App Feature Requirements

### 9.1 Admin Features
- **Create a competition** with a name, year, and start date
- **Add/remove players** (name + optional payment status)
- **Set up the race card** for each day (7 races with times)
- **Enter race results** (winner name + SP decimal odds) — manual entry is the primary flow, with optional API auto-population if available
- **Override/edit picks** if needed (e.g. correcting typos, applying Arsenalled rule)

### 9.2 Player Features
- **Submit picks** for each race — one horse per race
- **Designate one NAP per day** (exactly one, enforced by validation)
- **Deadline enforcement** — picks locked once a race starts
- **Arsenalled auto-assignment** — if a player misses a race, auto-assign the favourite; if NAP not yet used, make it the NAP

### 9.3 Dashboard / Leaderboard
- **Live leaderboard** ranked by overall P&L
- **Day-by-day breakdown** per player
- **Race-by-race detail** showing each player's pick, stake, whether it won, and the P&L
- **Daily and cumulative stats**: total winners, daily profit, overall profit

### 9.4 Race View
- For each race, show:
  - Race time
  - Winner + SP (once entered)
  - All players' picks for that race
  - Which picks were NAPs
  - Each pick's P&L

### 9.5 Pick Submission
- Currently picks are submitted ad-hoc via **Slack** — the app should replace this with a proper in-app submission flow
- Players should be able to submit picks via a simple form/UI for each race
- The admin should be able to see who has and hasn't submitted for upcoming races
- Consider a **shareable link** or lightweight auth (no full account system needed — these are mates, not enterprise users)

### 9.6 Notifications / Reminders (nice-to-have)
- Remind players to submit picks before each race deadline
- Alert when results are entered
- Slack integration for posting leaderboard updates to a channel (nice-to-have)

---

## 10. Validation Rules

1. **Exactly one NAP per day per player** — no more, no less
2. **One horse per race per player** — no duplicate race entries
3. **Picks must be submitted before race start time**
4. **If a player misses a race deadline**, auto-Arsenalled with favourite
5. **If NAP not yet used when Arsenalled**, the missed race becomes the NAP
6. **Entry fee is £10** — flat rate
7. **Daily cost is always £9** — 6×£1 + 1×£3

---

## 11. Glossary

| Term | Meaning |
|------|---------|
| **NAP** | A player's best bet of the day — carries a £3 stake instead of £1 |
| **SP** | Starting Price — the official odds at race start time |
| **Arsenalled** | Penalty for missing a race deadline — auto-assigned the favourite |
| **P&L** | Profit and Loss — winnings minus stake |
| **Acca** | Accumulator — combined odds of all winners (for fun) |
| **Timeform** | A common odds reference source (timeform.com) — but any reliable SP source works |
| **Cheltenham Festival** | Annual 4-day horse racing festival in March, held at Cheltenham Racecourse |