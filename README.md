# Ball Knowledge

A daily sports trivia game — "BeReal for sports knowledge." You play a short
recall quiz once per day, earn points, build a rating, and climb leaderboards
against ~40 simulated bot players. Lifetime rating is monotonic. Seasonal score
floors at zero so falling behind never feels permanent. Missing a day costs you;
being wrong does not.

This MVP runs entirely in the browser — no backend, no accounts, no API calls.
The whole world (40 bots, groups, question stats, the human's progress) lives
in a single JSON blob in `localStorage`.

> **Integrity caveat — read before trusting the scoreboard.** The question bank
> is authored by Claude with no external fact-checking. Until you review it,
> treat rankings as illustrative; facts may be wrong or stale. Questions
> flagged with `// REVIEW:` comments call out the specific claim you should
> verify. Recommend a human fact-check pass before sharing the scoreboard with
> anyone who'd take it seriously.

## Run it

You need [Node.js](https://nodejs.org/) (18+).

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

For a production bundle:

```bash
npm run build
npm run preview
```

## What's in here

```
src/
  config.ts            ALL tunable constants in one place (see table below)
  App.tsx              Router + atmosphere shell
  styles/              tokens / global / atmosphere / components / screens
  data/
    questions.ts       The question bank (multiple_choice + fill_in_blank + matching)
    seed.ts            buildSeedDB — 40 bots, 3 squads, 5 arenas, 12-day backfill
  db/
    types.ts           Canonical type definitions (Question, DB, PlayerStats, …)
    storage.ts         localStorage load/save (the ONE module that talks to storage)
    repo.ts            Pure query/mutation helpers over a DB
    store.ts           Zustand store + selector hooks (useDB, useHumanStats, …)
  domain/
    time.ts            Drop window math + sim/live mode helpers
    difficulty.ts      effectiveDifficulty (lives off live answer data)
    selection.ts       selectDailyQuiz — the single fairness chokepoint
    grading.ts         gradeAnswer per format
    scoring.ts         applyQuizResult — points + streak + per-sport + recently-seen
    bots.ts            simulateBotsForDay — pCorrect uses HIDDEN intrinsic
    season.ts          rollDay + rollSeason + advanceDays (loop, never jumps)
    leaderboard.ts     aggregateLeaderboard (scope x view)
    titles.ts          computeTitleHolders (seasonal-based)
  formats/
    multipleChoice.tsx  render + grade
    fillInBlank.tsx     render + grade (normalized text)
    matching.tsx        render + grade (all-correct)
  components/           Atmosphere / BigNumber / TimerRing / DropReveal / …
  hooks/
    useCountUp.ts
    useGameClock.ts
  screens/
    Home / Quiz / Results / Leaderboards / Groups / GroupDetail / Dev
```

See [`PLAN.md`](./PLAN.md) for the full architecture, data model, fairness
analysis, and visual-direction rationale.

## How a day plays

1. The DB seeds on first run: 40 bots get shaped per-sport skill profiles,
   3 squads + 5 per-sport arenas are formed, and the world simulates 12 days
   of bot-only play before the human's day 1. The human stays at zero
   throughout backfill. Net effect: you open to a populated leaderboard, a
   partially-calibrated difficulty engine, and bots holding the initial
   "[sport] guy" titles.
2. By default the world is in **sim mode** with the window already set to
   `morning` — the daily quiz is playable immediately. Switch to **live mode**
   in the Dev panel to make the windows track your real wall clock
   (`MORNING_DROP_HOUR = 10`, `EVENING_DROP_HOUR = 22`).
3. The quiz is 5 questions per the difficulty recipe (2 easy / 2 medium /
   1 hard) by **effective** difficulty (live-calibrated), with a sport-bias
   toward your preferred sports.
4. Points are flat (`POINTS_PER_QUESTION = 10`). Wrong / timed-out answers
   score nothing. Lifetime is monotonic; seasonal accrues here and is the
   board that decays on missed days.
5. On day rollover, every player who missed the prior day loses
   `SEASONAL_MISS_PENALTY = 8` from their seasonal score (floored at 0),
   then bots simulate the new day, then the season check fires.

## Adding a question

Open [`src/data/questions.ts`](src/data/questions.ts) and copy an existing
entry. Required fields are documented at the top of that file. Specifically:

- `intrinsic` is a hidden author-set scalar in `[0, 1]`, interpreted as the
  expected accuracy of a competent fan (skill ≈ 0.7) on this question. Bots
  use this to compute their `pCorrect`; the displayed difficulty engine never
  reads it. Keep it independent of `difficulty` (the displayed bucket) on
  purpose — that's what lets the engine measure a real signal instead of
  confirming its own labels.
- For fill-in-blank, list 2–4 acceptable variants. Normalization is generous
  (lowercase, no punctuation, strip a leading article), but answers should
  still be short and unambiguous.
- For matching, all four pairs must be matched correctly — partial credit
  is not supported.

If you're not 100% confident about a claim, drop a `// REVIEW: ...` comment.

## Adding a bot

Edit `BOT_SEEDS` in [`src/data/seed.ts`](src/data/seed.ts). Each entry has a
`name` and a `shape`:

```ts
{ name: 'NewBot', shape: { kind: 'specialist', primary: 'NBA', tier: 'high' } }
{ name: 'NewBot', shape: { kind: 'specialist', primary: 'NFL', secondary: 'NBA', tier: 'mid' } }
{ name: 'NewBot', shape: { kind: 'generalist' } }
{ name: 'NewBot', shape: { kind: 'casual' } }
```

Skills and reliability are sampled from those slots. Reseed via the Dev panel
to pick up changes (the existing DB blob is replaced).

## Tunable constants

All in [`src/config.ts`](src/config.ts).

| Constant | Default | What it does |
| --- | ---: | --- |
| `QUIZ_SIZE` | 5 | Questions per daily quiz |
| `DIFFICULTY_RECIPE` | `{easy:2, medium:2, hard:1}` | Slot counts per quiz |
| `POINTS_PER_QUESTION` | 10 | Flat reward per correct answer |
| `TIMER_SECONDS_BY_FORMAT.multiple_choice` | 15 | MC per-question timer |
| `TIMER_SECONDS_BY_FORMAT.fill_in_blank` | 22 | FIB per-question timer |
| `TIMER_SECONDS_BY_FORMAT.matching` | 28 | Matching per-question timer |
| `MORNING_DROP_HOUR` | 10 | Local hour the morning drop opens |
| `EVENING_DROP_HOUR` | 22 | Local hour the evening drop opens |
| `MIN_SAMPLE` | 20 | Plays before `effectiveDifficulty` rebuckets |
| `EASY_THRESHOLD` | 0.70 | Accuracy ≥ this rebuckets to easy |
| `HARD_THRESHOLD` | 0.35 | Accuracy < this rebuckets to hard |
| `RECENT_BUFFER` | 30 | Recently-seen exclusion window length |
| `SPORT_BIAS_PCT` | 0.70 | Chance a slot is restricted to preferred sports |
| `SEASONAL_MISS_PENALTY` | 8 | Points subtracted per missed day |
| `SEASONAL_SCORE_FLOOR` | 0 | seasonalScore never drops below this |
| `SEASON_LENGTH_DAYS` | 30 | Length of a season in days |
| `BOT_COUNT` | 40 | Number of seeded bots |
| `BOT_NOISE` | 0.10 | ± noise band on bot pCorrect |
| `BACKFILL_DAYS` | 12 | Days of bot-only play before user opens for the first time |
| `DB_STORAGE_KEY` | `'ball-knowledge:db'` | localStorage key for the DB blob |
| `ANSWER_EVENT_RETENTION_DAYS` | 30 | Days of AnswerEvents kept (older are pruned) |

## Resetting the world

The Dev panel has three reset levels:

- **Reset today** — wipes your `lastPlayedDay` so you can replay today.
- **Reset season** — zeros out everyone's seasonal scores (incl. perSport
  seasonal totals — the titles immediately re-race). Lifetime is untouched.
- **Reseed DB** — wipes localStorage and runs the full seed (40 bots,
  groups, 12-day backfill). Asks for confirmation.

You can also wipe manually:

```js
localStorage.removeItem('ball-knowledge:db');
location.reload();
```

## Where the fairness contract lives

`domain/selection.ts.selectDailyQuiz` is the single chokepoint. It selects on
**effective** difficulty (live-calibrated), excludes recently-seen, biases
toward preferred sports, and falls back gracefully when buckets are small.
Documented limits: the first `MIN_SAMPLE` plays of any question use the
author-seeded bucket, which may be wrong; sport-biased selection means
specialists see more of their lane. See `PLAN.md` for the full discussion.

## Out of scope (intentional)

- No real accounts, login, or friend invites.
- No AI question generation — the bank is hand-authored.
- No push notifications. Live mode tracks the wall clock; sim mode lets you
  fast-forward via the Dev panel.
- No native mobile build — responsive mobile-first web only.
