# Ball Knowledge — Build Plan

> A daily sports trivia game: "BeReal for sports knowledge." This document is
> the architectural plan written before code. See README.md for how to run.

## Guiding principles

1. **Trust in the scoreboard is the product.** Ranking must feel earned.
2. **Punish absence, not error.** Wrong answers cost nothing; missing the day does.
3. **Always leave a path back.** Seasonal penalty floors at 0.

## Integrity caveat (read this first)

The question bank is authored by Claude with no external fact-checking. Until
you review it, treat rankings as illustrative — facts may be wrong or stale.
Questions the author was unsure about are flagged with `// REVIEW:` comments
listing the specific claim to verify. Recommend a fact-check pass before
sharing the scoreboard with anyone who'd take it seriously.

---

## Stack

- Vite + React 18 + TypeScript (already present)
- Zustand (state) + react-router-dom v6 (routing) — the only new deps
- Plain CSS with design tokens
- localStorage as the persistence layer, accessed only through a repository

No animation library — Web Animations API + CSS handle motion.
Fonts via Google Fonts: Bebas Neue (display), Space Grotesk (body),
JetBrains Mono (big numbers / timer).

---

## Folder structure

```
src/
  config.ts                 # ALL tunable constants in one place
  main.tsx
  App.tsx                   # router + atmosphere shell
  styles/
    tokens.css              # CSS variables (color, type, spacing, radii)
    global.css              # reset, base, fonts
    atmosphere.css          # noise + gradient mesh
    components.css          # buttons, cards, tags, board rows
    screens.css             # screen-specific layouts
  data/
    questions.ts            # question bank
    botNames.ts             # handle pool
    seed.ts                 # buildSeedDB(): bots, groups, backfill
  db/
    types.ts                # PlayerProfile, AnswerEvent, DB, ...
    storage.ts              # load/save the single namespaced blob
    repo.ts                 # the only module that reads/writes the DB
    store.ts                # zustand store wrapping the repo
  domain/
    time.ts                 # game-time advance, window detection
    difficulty.ts           # effective-difficulty calc
    selection.ts            # selectDailyQuiz() — fairness lives here
    scoring.ts              # apply quiz result to lifetime + seasonal + streak
    grading.ts              # gradeAnswer() per format
    bots.ts                 # simulateBotsForDay()
    season.ts               # rollSeason()
    titles.ts               # computeSportTitleHolders()
    leaderboard.ts          # aggregateLeaderboard(scope, view)
  formats/
    multipleChoice.tsx      # render + grade
    fillInBlank.tsx         # render + grade (text normalization)
    matching.tsx            # render + grade
  components/
    Atmosphere.tsx          # noise + gradient mesh
    BigNumber.tsx           # display-font number with optional count-up
    TimerRing.tsx           # circular SVG timer ring
    AnswerButton.tsx        # MC option with resolve states
    Tag.tsx                 # difficulty / sport pill
    LeaderboardRow.tsx
    SegmentedControl.tsx
    DropReveal.tsx          # 3-2-1 quiz entrance overlay
  hooks/
    useCountUp.ts
    useGameClock.ts         # live-mode wall-clock sync ticker
  screens/
    Home.tsx
    Quiz.tsx
    Results.tsx
    Leaderboards.tsx
    Groups.tsx
    GroupDetail.tsx
    Dev.tsx
```

---

## Data model

A single DB blob persisted under `localStorage["ball-knowledge:db"]`, accessed
only through `src/db/repo.ts`. Schema-versioned for future migrations.

```ts
type Difficulty = 'easy' | 'medium' | 'hard';
type Sport = 'NBA' | 'NFL' | 'MLB' | 'UFC' | 'Soccer' | 'general';
type Window = 'pre' | 'morning' | 'evening' | 'closed';

interface PlayerProfile {
  id: string;
  name: string;
  isHuman: boolean;
  preferredSports: Sport[];
  sportSkills?: Partial<Record<Sport, number>>;  // bot only, 0..1 by sport
  reliability?: number;                          // bot only, 0..1
}

interface PlayerStats {
  playerId: string;
  lifetimePoints: number;                              // monotonic
  seasonalScore: number;                               // floors at 0
  perSportLifetimePoints: Partial<Record<Sport, number>>;  // monotonic
  perSportSeasonalPoints: Partial<Record<Sport, number>>;  // resets each season,
                                                       //   basis for "X guy" titles
  streak: number;
  longestStreak: number;
  lastPlayedDay: number | null;
  recentlySeenQuestionIds: string[];
}

interface QuestionStat { questionId; timesShown; timesCorrect; }
interface AnswerEvent { playerId; questionId; day; wasCorrect; }
interface Group { id; name; type: 'squad'|'arena'; sport?: Sport; memberIds: string[]; }
interface SeasonState { number; startDay; endDay; }
interface GameTime {
  currentDay: number;
  currentWindow: Window;
  mode: 'live' | 'sim';
  liveAnchor?: { realIsoAt: string; gameDay: number };
}

interface DB {
  schemaVersion: 1;
  humanPlayerId: string;
  players: PlayerProfile[];
  stats: PlayerStats[];
  questionStats: QuestionStat[];
  answers: AnswerEvent[];     // append-only, pruned to last 30 days
  groups: Group[];
  season: SeasonState;
  time: GameTime;
}
```

---

## Difficulty engine

Every question carries TWO separate difficulty values, kept independent on
purpose:
- `difficulty`: displayed/seed bucket (easy/medium/hard) used by the recipe
- `intrinsic ∈ [0, 1]`: **hidden** authored scalar (≈ expected accuracy of a
  competent fan, skill ≈ 0.7), used **only** by bot `pCorrect` math

If bots derived their accuracy from `effectiveDifficulty`, the engine would
just confirm its own labels. With `intrinsic` as independent ground truth, the
engine measures an independent signal and `effectiveDifficulty` genuinely
tracks reality.

```ts
function effectiveDifficulty(q, stat) {
  if (stat.timesShown < MIN_SAMPLE) return q.difficulty;     // seed tag
  const acc = stat.timesCorrect / stat.timesShown;
  if (acc >= EASY_THRESHOLD) return 'easy';
  if (acc >= HARD_THRESHOLD) return 'medium';
  return 'hard';
}
```

Defaults: `MIN_SAMPLE = 20`, `EASY_THRESHOLD = 0.70`, `HARD_THRESHOLD = 0.35`.

---

## Daily quiz selection (the fairness contract)

`selectDailyQuiz(profile, db)` in `domain/selection.ts` is the single chokepoint
for fairness. It builds a 5-question quiz following
`DIFFICULTY_RECIPE = { easy: 2, medium: 2, hard: 1 }`:

1. Bucket questions by **effective** difficulty (not seed)
2. Exclude recently-seen (last `RECENT_BUFFER = 30` per player)
3. Sport bias: each slot has `SPORT_BIAS_PCT = 0.7` chance of being restricted
   to the player's `preferredSports`
4. Fallback: if a bucket is short after exclusions, drop the recently-seen
   filter for that bucket; then allow any difficulty
5. Shuffle the final 5 so easy/medium/hard order is interleaved

**Fairness limits** (the "hard problem" called out in the brief):
- Effective-difficulty calibration is empirical; the first `MIN_SAMPLE` plays
  of a question may misrepresent it. The recipe still balances counts per
  bucket, which keeps expected scores close even when individual question
  difficulty is mis-tagged.
- Sport-biased selection means specialists see more of their lane. This is by
  design but means cross-sport leaderboard comparisons are less fair than
  per-sport ones.
- All correct answers are flat-valued, so the *recipe* is the only knob that
  shapes expected score. The matching rule lives entirely in `selectDailyQuiz`
  for easy future upgrades (IRT-style calibration, paired question sets, etc.).

---

## Scoring + seasonal absence

`applyQuizResult(playerId, result)`:
- `lifetimePoints += correctCount * POINTS_PER_QUESTION`
- `seasonalScore += correctCount * POINTS_PER_QUESTION`
- For each correctly-answered question's sport, increment BOTH
  `perSportLifetimePoints[sport]` and `perSportSeasonalPoints[sport]`
- Streak: if `lastPlayedDay === currentDay - 1`, increment; else reset to 1.
- `lastPlayedDay = currentDay`

`rollSeason()` zeroes `seasonalScore` AND `perSportSeasonalPoints` for every
player; `lifetimePoints` and `perSportLifetimePoints` are untouched.

**Titles are seasonal**: `computeSportTitleHolders` reads
`perSportSeasonalPoints`, so "NBA guy" is a fresh race every season — the "path
back" principle in action. The lifetime map is preserved for a future
all-time/archive view.

**Seasonal absence rule** (tradeoff documented):
- On day rollover, every player whose `lastPlayedDay < currentDay - 1` loses
  `SEASONAL_MISS_PENALTY` from `seasonalScore`, floored at 0.
- I chose a flat per-miss penalty over gentle decay. The flat penalty reads
  more clearly ("missing yesterday cost 8 points") and pairs with the streak
  mechanic. The floor of 0 preserves the "path back" principle either way.
  Switching to decay is a one-line change in `season.ts`.

---

## Game time & day rollover

**Default on fresh seed**: `mode: 'sim'`, `currentDay: 1`, `currentWindow: 'morning'`.
The first run lands the player in a playable state immediately. Live mode is
opt-in via the Dev panel.

- `MORNING_DROP_HOUR = 10`, `EVENING_DROP_HOUR = 22`
- `00:00–10:00` → `pre` (locked, countdown to morning drop)
- `10:00–22:00` → `morning` (playable)
- `22:00–24:00` → `evening` (second chance)
- `24:00` rolls the day

**One rollDay per elapsed day**, always. `advanceDays(n)` is implemented as
`for (let i = 0; i < n; i++) rollDay()`. Live-mode catch-up uses the same
loop when the app reopens after a multi-day gap. The loop is the ONLY path
that mutates `currentDay`. Jumping the counter directly would skip bot plays,
missed-day penalties, and season checks — exactly the texture the user wants
to see.

`rollDay()` orchestrates, in order:
1. Seasonal-miss penalty for every player who didn't play yesterday
2. `simulateBotsForDay(newDay)` — fills today's leaderboard and question stats
3. Season check: if `currentDay >= season.endDay`, call `rollSeason()`

---

## Bot simulation

40 bots with distinctive handles and per-sport skill profiles (most have one or
two strong sports, weaker elsewhere; a few well-rounded). Each has
`reliability ∈ [0.75, 0.98]`, so some miss days and pay the penalty.

`simulateBotsForDay(day)`: for each bot that passes its reliability gate, build
a quiz via the same `selectDailyQuiz` with that bot's profile, then compute
each answer from the **hidden intrinsic** scalar (NOT `effectiveDifficulty`):

```ts
const skill = bot.sportSkills[q.sport] ?? 0.40;
const noise = (Math.random() - 0.5) * BOT_NOISE;   // ±0.05 by default
const pCorrect = clamp01(q.intrinsic + (skill - 0.70) + noise);
const wasCorrect = Math.random() < pCorrect;
```

`effectiveDifficulty(q)` is never consulted inside this loop. Bot answers
produce real `AnswerEvent`s; the engine reads those events later and rebuckets
independently.

---

## Groups & titles

- **Squads (private)**: 3 named squads, each with the human + 4–6 bots
- **Arenas (public)**: one per sport (5 total). Members = all bots whose
  `sportSkills[sport] > 0` + the human

`computeSportTitleHolders(scope)`: for each sport, the member of the scope
with the highest `perSportSeasonalPoints[sport]` holds "[sport] guy" within
that scope. Surfaced as a gold pill on leaderboard rows. The Results screen
detects when the human just took a title (before/after compare) and triggers
a brief celebration.

---

## Question formats

Discriminated union:

```ts
type Question = MultipleChoice | FillInBlank | Matching;

interface Base {
  id; text; difficulty; sport;
  intrinsic: number;   // hidden, see Difficulty engine
}

interface MultipleChoice extends Base { type: 'multiple_choice'; options: string[]; correctIndex: number; }
interface FillInBlank   extends Base { type: 'fill_in_blank'; acceptableAnswers: string[]; }
interface Matching      extends Base { type: 'matching'; pairs: { left: string; right: string }[]; }
```

Each format module exports `{ render(props), grade(question, answer): boolean }`.
Bots short-circuit by producing `{ wasCorrect: boolean }` directly, so graders
never run on fake values.

**Fill-in-blank** answers are kept short and unambiguous. Normalizer:
lowercase → trim → collapse whitespace → strip punctuation → strip leading
articles. Each question lists 2–4 reasonable variants.

**Matching**: 4 left ↔ 4 right. All-correct or it's wrong.

Per-format timers: `multiple_choice: 15s`, `fill_in_blank: 22s`, `matching: 28s`.

---

## Seeded backfill (so the world feels alive on first open)

`buildSeedDB()` runs `BACKFILL_DAYS = 12` days of bot-only play before
`currentDay = 1`. The human stays at 0. After backfill:
- Leaderboards have shape, not zeros
- ≈2,000 answer events spread over ~150 questions — most cross `MIN_SAMPLE`
  shortly after the human's first run, so the difficulty engine has real data
- Initial title holders are established

---

## Visual design

**Type**: Bebas Neue (display), Space Grotesk (body), JetBrains Mono (numbers).
**Palette**:
```
--bg:        #0a0c0d   /* near-black */
--surface:   #13171a
--surface-2: #1f262b
--border:    rgba(214,255,79,0.10)   /* lime-tinted hairline */
--text:      #f0f3f5
--muted:     #8a92a0
--accent:    #d6ff4f   /* acid lime — the "live" color */
--correct:   #22dd66
--wrong:     #ff3b30
--danger:    #ff3b30   /* timer low */
```

The lime accent is used sparingly: live drop CTA, "YOU" row highlight, title
pill, draining timer ring. Atmosphere: corner gradient mesh + faint SVG noise.

**Motion budget** (spent only on these):
1. 3-2-1 drop reveal before quiz
2. Correct: option pulse + ring flash. Wrong: option shake + red flash.
3. Results: count-up tally on points + lifetime + seasonal
4. Title taken: full-width banner slide-in

Everything else is snappy or static.

---

## Phases (commit after each)

**Priority if time runs short**: correctness > end-to-end flow > question
quality > question quantity > polish > nits. Cut from the bottom.

0. Plan artifact + git init
1. Foundation: tokens, fonts, atmosphere, install deps
2. Data layer: types, storage, repo, store
3. Seed + question bank + 12-day backfill
4. Game time + drop windows + lock
5. Difficulty engine
6. Daily quiz selection
7. Question formats (MC, FIB, matching)
8. Quiz screen rebuild
9. Scoring + streak
10. Bot simulation
11. Day rollover + season reset
12. Leaderboards (scope × view, titles)
13. Groups (list + detail)
14. Home redesign
15. Results + title celebration
16. Dev panel + question debug table (see seed/intrinsic/timesShown/effective
    side by side)
17. README + integrity note + polish

---

## Verification

1. Fresh DB: human at 0 but leaderboards are populated (12d backfill); window
   is `morning`; play CTA is active immediately
2. All three formats appear across a few quizzes, with extended timers for FIB
   and matching
3. Timer → 0 = no-answer with no penalty
4. Results count-up; lifetime + seasonal update; streak = 1; title celebration
   fires when applicable
5. Leaderboards: World / per-sport / squads / arenas, lifetime + seasonal —
   human highlighted, title pills on holders
6. Dev → Advance 7 days: `currentDay` increments exactly 7; some
   `effectiveDifficulty` buckets diverge from seed `difficulty` (visible in the
   debug table) — confirms the engine is measuring an independent signal
7. Dev → Force window cycles home state correctly
8. Dev → Switch to live mode, close app, advance clock 1 day, reopen — one
   `rollDay()` runs during catch-up
9. Dev → Reset season: seasonal scores zero, lifetimes untouched
10. `npm run build` succeeds (TS strict)
11. `localStorage` blob shape matches the schema and `intrinsic` is present on
    every question but never appears in the UI

---

## Tunable constants

All in `src/config.ts`:

| Constant | Default | What it does |
| --- | --- | --- |
| `QUIZ_SIZE` | 5 | Questions per daily quiz |
| `DIFFICULTY_RECIPE` | `{easy:2, medium:2, hard:1}` | Slot counts per quiz |
| `POINTS_PER_QUESTION` | 10 | Flat reward per correct |
| `TIMER_SECONDS_BY_FORMAT` | `{mc:15, fib:22, match:28}` | Per-format timer |
| `MORNING_DROP_HOUR` | 10 | First daily drop |
| `EVENING_DROP_HOUR` | 22 | Second chance |
| `MIN_SAMPLE` | 20 | Plays before `effectiveDifficulty` rebuckets |
| `EASY_THRESHOLD` | 0.70 | Accuracy above this = easy |
| `HARD_THRESHOLD` | 0.35 | Accuracy below this = hard |
| `RECENT_BUFFER` | 30 | Recently-seen exclusion window |
| `SPORT_BIAS_PCT` | 0.7 | Chance a slot is restricted to preferred sports |
| `SEASONAL_MISS_PENALTY` | 8 | Points lost per missed day |
| `SEASONAL_SCORE_FLOOR` | 0 | Seasonal score never goes below this |
| `SEASON_LENGTH_DAYS` | 30 | Season length |
| `BOT_COUNT` | 40 | Seeded bots |
| `BOT_NOISE` | 0.10 | ± noise band on bot `pCorrect` |
| `BACKFILL_DAYS` | 12 | Days of bot-only play before day 1 |
