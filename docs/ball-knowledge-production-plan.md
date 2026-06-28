# Ball Knowledge — Production Plan

> From single-player prototype to an App Store product real people can use.
> Working doc. Last updated: June 6, 2026.

---

## 0. Decisions locked

These are settled — don't relitigate them while building. If one starts to feel
wrong, change it deliberately, not by drift.

- **Question model:** Shared daily set. Everyone gets the same ~5 questions each day.
  (Revisit only if/when you add an optional unranked practice mode later.)
- **Backend:** Supabase (Postgres + Auth + Row-Level Security + Edge Functions).
- **Native path:** React Native + Expo (reuses your TypeScript/React; not a rewrite).
- **Anti-cheat at launch:** server-anchored timer + app-switch/backgrounding detection.
  Nothing invasive (no eye-tracking, no audio) until cheating is a *measured* problem.
- **Bots:** Local design aid ONLY. Never shipped, never in the production database.
  Real users only ever see real humans. (See Section 3.)
- **Launch milestone:** App Store + Play Store. Friends/family get a TestFlight /
  Play internal beta first for feedback, before public release.

---

## 1. The reframe — what you have vs. what you need

What exists today is an excellent **single-player prototype and design reference**.
Keep all of it: the screens, the Wordle/Duolingo styling, the question formats, the
scoring philosophy ("punish absence, not error"), the share grid.

Three things make it a toy right now, and all three share one root cause:
**there is no server, so the client is the source of truth.**

1. The correct answers ship to the browser (`correctIndex` lives in `questions.ts`),
   so it's trivially cheatable via dev tools.
2. The clock is the device's own clock, so "what day is it / is the window open" is
   whatever the phone says — spoofable.
3. No accounts and no shared state — "competition" is you vs. 40 bots in localStorage.

None of these are fixable with more frontend work. They're fixed by moving authority
to a backend.

**The one real strength to lean on:** your `db/repo.ts` + `db/storage.ts` split
isolates all storage behind a repository. Swapping localStorage for Supabase is
contained to that layer instead of rippling through every screen. Preserve that seam.

---

## 2. Architecture — server-authoritative shared daily

Mental model: **the client renders and submits; the server decides everything that
matters.**

### 2.1 Supabase schema (sketch)

Small and relational. Refine column names during build.

- `profiles` — one row per user, linked to Supabase Auth. Display name, avatar seed,
  created_at.
- `questions` — the bank. Includes `verified` (bool) and `source_url` (text). The
  correct answer lives here and is **never sent to the client pre-submit**.
- `daily_sets` — which question IDs are "today," plus a publish timestamp.
- `submissions` — one row per user per day: their answers, server-recorded start time,
  submit time, and the server-computed score. This table is the leaderboard.
- `leagues` + `league_members` — for the friend graph (Phase 6).
- `friendships` — for username/contact friends (Phase 6).

Leaderboards are SQL queries/views over `submissions`. This relational shape is exactly
why Postgres beats a NoSQL store here.

### 2.2 Non-negotiables (build these correctly or nothing else matters)

- **Answers stay server-side until after submit.** Client fetches today's questions
  *without* the answer field → user answers → client POSTs answers to a Supabase Edge
  Function → function grades, writes the score, and returns the result + now-revealed
  correct answers for the recap. This single change beats every fancy anti-cheat idea.
- **Server time is the clock.** Drop window, daily rollover, and "have you played today"
  all read the server timestamp. A scheduled function publishes each day's set and the
  daily boundary. Your current client-advances-days model becomes server-driven.
- **The timer is server-anchored.** Server records start time when the set is fetched;
  the submission is rejected or flagged if it arrives after the allowed window. A
  client-side countdown alone is just decoration.

### 2.3 Anti-cheat at launch

- Server-anchored timer (above) — the real enforcement.
- App-switch/backgrounding detection: `visibilitychange` (web) / `AppState` (React
  Native). Log it; flag or void the round if they leave mid-quiz.
- Short per-question timers (already in your config).
- **Deferred to "v3, only if measured":** eye-tracking, audio listening. Privacy and
  App-Store-rejection minefield, huge build, not justified at your scale.

---

## 3. Bots — local design aid only

This is a hard rule, not a preference.

- **Why bots existed:** to make the leaderboard look alive in a single-player prototype.
- **New policy:** bots are a *local development tool* you use to evaluate how screens
  look when populated (e.g., "does the league row layout hold up with 40 entries?").
  They help *you* make UI/UX decisions. That's their entire remaining job.
- **They must never ship.** When a real user downloads the app, there are zero bots,
  zero simulated players, zero fake scores. Real humans only.

### 3.1 How to enforce that in code

- Keep the bot simulation code, but gate it behind a dev-only flag (env var / dev build).
- In local dev you can seed a fake populated board purely to inspect layout.
- Production build: the bot code path never runs, and **no bot rows ever exist in the
  production database.**
- The grading/leaderboard/season logic must work identically with real data — bots
  were never load-bearing, only cosmetic.

### 3.2 The cost of removing bots: the cold-start problem

Without bots, a brand-new user can open the app to an empty leaderboard. That's a real
UX risk and must be designed for, not faked. The fixes (these make it a better product
anyway):

- **Lead with invite-driven leagues, not a global board of strangers.** You compete with
  people you invited. An empty *global* board is fine if a new user's first action is
  "start a league and invite friends."
- **Strong empty states.** "You're early — invite your group chat to start the
  competition." A clear CTA, not a sad blank list.
- **Don't surface a global/world leaderboard until there's real density.** Hide or
  soften it early; reveal it once enough humans are playing for it to feel alive.

---

## 4. Content — sourcing and verification

Accuracy is your entire credibility. A trivia app with wrong answers is dead on arrival.
So regardless of where questions come from, you need a *pipeline*, not a raw feed.

### 4.1 Where to source raw material

- **Open Trivia Database (opentdb.com)** — completely free JSON API, no key, has a Sports
  category, filter by difficulty. Caveat: community-contributed (~4,000 questions across
  all topics), so quality/accuracy varies and it's general sports, not deep.
- **The Trivia API / API Ninjas Trivia** — same shape, larger banks behind paid tiers
  (free tiers are small). Useful as supplementary raw material.
- **Live-stats sources for fresh/accurate questions** — Sportradar, API-Sports (paid
  pro), and balldontlie (free NBA stats) are worth evaluating if you want current,
  fans-actually-argue-about-this content generated from real stats. (Check each one's
  current pricing and terms before relying on it — these change.)

None of these guarantee correctness. Treat them as drafts, never as truth.

### 4.2 The pipeline (the part that actually matters)

Draft → **Verify** → Store → Publish.

1. **Draft:** pull candidates from OpenTDB and/or generate from a stat source with
   Claude. Each generated question comes *with* a citation for its answer.
2. **Verify:** cross-check every fact against its source. This is the step your README
   currently admits you skip — it stops being optional in production.
3. **Store:** save to `questions` with `verified = true` and a `source_url`. Only
   verified questions are eligible for a daily set.
4. **Publish:** the daily set pulls only from the verified pool. Bank 30–60 days ahead
   so you never scramble.

Fits your existing workflow: a Claude-assisted "draft tomorrow's 5 with sources for my
approval" routine (similar to the newsletter-digest automation you already run).

---

## 5. App Store path (the real launch)

- **Native via Expo (React Native).** Reuses your TypeScript, React, and most domain
  logic. Expo's EAS service builds + submits binaries and handles push notifications.
- **Push notifications = your #1 retention lever.** The daily-drop reminder. Build it in.
- **Accounts you'll need:** Apple Developer ($99/year), Google Play ($25 one-time).
- **Review gotchas to design for now:**
  - If you offer Google sign-in, you must *also* offer **Sign in with Apple**.
  - Privacy labels declaring what you collect.
  - You have no user-generated content and no real-money stakes, so the nastiest review
    categories (UGC moderation, gambling) don't apply. Good.
- **Beta without launching:** TestFlight (iOS) and Play internal testing (Android). Run
  a real beta there for weeks with friends/family, iterate, then flip to public.

---

## 6. Phased roadmap

Each phase has a goal, the work, and a **Confirm before moving on** gate. Don't advance
past a gate until every box is true.

### Phase 1 — Server-authoritative core (still on web)

**Goal:** two people on two phones' browsers log in, get the same daily 5, and see a
real shared leaderboard.

**Work:**
- Stand up Supabase: schema (Section 2.1) + Auth (email to start; add Apple/Google later).
- Move questions, grading, the timer, and the clock server-side (Edge Function + scheduled
  function).
- Repoint the existing screens from localStorage to Supabase via the `repo` seam.
- Gate bot code behind a dev-only flag; ensure no bot rows reach the Supabase DB.
- Build empty states for the leaderboard (cold-start).

**✅ Confirm before moving on:**
- [ ] The correct answer is **not** present anywhere in the network response before
      submitting (check the network tab — this is the critical one).
- [ ] Grading happens server-side; the client only displays what the server returns.
- [ ] Two different accounts get the identical daily set on the same day.
- [ ] The day/window is driven by server time, not the device clock (changing the phone's
      clock does nothing).
- [ ] Submitting after the timer window is rejected/flagged by the server.
- [ ] The production database contains zero bot/simulated rows.
- [ ] A fresh account sees a sensible empty state, not a broken/blank screen.

### Phase 2 — Content pipeline + bank

**Goal:** a repeatable way to produce verified questions, and 30–60 days banked.

**Work:**
- Build the draft → verify → store flow.
- Author/verify enough sets to bank 30–60 days.
- Wire the daily publish to pull only `verified = true` questions.

**✅ Confirm before moving on:**
- [ ] Every question in the pool has `verified = true` and a real `source_url`.
- [ ] The daily publish can only select verified questions.
- [ ] You've spot-checked a random sample of answers against their sources and found
      them correct.
- [ ] At least 30 days of sets are banked.

### Phase 3 — Go native with Expo

**Goal:** the web app becomes an installable iOS/Android app.

**Work:**
- Port to React Native + Expo.
- Add push notifications (daily-drop reminder).
- Add `AppState` app-switch detection.
- Add Sign in with Apple (+ Google if desired).

**✅ Confirm before moving on:**
- [ ] App builds and runs on a real iOS device and a real Android device.
- [ ] Push notification fires for the daily drop.
- [ ] Leaving the app mid-quiz is detected and handled.
- [ ] Sign in with Apple works (required if Google sign-in is offered).
- [ ] The full play → grade → leaderboard loop works on device against Supabase.

### Phase 4 — TestFlight / Play internal beta

**Goal:** close friends and family playing daily, giving feedback.

**Work:**
- Distribute via TestFlight + Play internal testing.
- Watch real usage; fix the core loop based on what confuses people.

**✅ Confirm before moving on:**
- [ ] Multiple real humans have completed the daily quiz on multiple days.
- [ ] Leaderboard reflects real results correctly across users.
- [ ] No correctness complaints about questions.
- [ ] Retention signal: people come back the next day without being nagged.

### Phase 5 — App Store + Play submission → public launch

**Goal:** publicly downloadable.

**Work:**
- Privacy labels, store listing, screenshots.
- Submit; address review feedback.

**✅ Confirm before moving on (to "launched"):**
- [ ] Approved on both stores.
- [ ] A stranger can download, sign up, and play with zero hand-holding.
- [ ] Cold-start empty state holds up for a brand-new user with no friends yet.

### Phase 6 — The friend graph (post-launch)

**Goal:** the social product you actually want.

**Order (least to most privacy overhead):**
1. **Invite-link leagues** — most viral, least friction. Do this first.
2. **Username search.**
3. **Contacts-based friends** — last, because it needs permission prompts and extra
   privacy review.
- Optional: **unranked practice mode** (random questions, doesn't feed the competitive
  board) so people can play more / play late without spoiler or fairness concerns.

---

## 7. What NOT to do

- Don't build invasive anti-cheat (eye-tracking, audio) now.
- Don't keep the difficulty-calibration engine as anything but inert scaffolding — under
  shared daily questions, fairness is automatic and that machinery isn't earning its
  complexity yet.
- Don't ship bots, ever, to real users.
- Don't add more screens before the backend exists — a beautiful client over no server is
  still a toy.
- Don't ship a single question you haven't verified.

---

## 8. Costs (near-zero to start)

- Supabase: free tier to start.
- Apple Developer: $99/year.
- Google Play: $25 one-time.
- Expo / EAS: free tier (paid for higher build volume).
- Question data: OpenTDB free; paid APIs only if/when you want deeper content.

---

## 9. Immediate next step

Phase 1, step one: **stand up Supabase and get the answer off the client.** Two clean
ways to start — pick one:

- A simple Cursor prompt to scaffold Supabase + auth + the answer-hiding grading function.
- The actual Supabase schema (tables + the grading Edge Function) written out so you can
  paste it in.

Either is a good first move. The win condition for the whole first push: open the network
tab during a quiz and confirm the correct answer is nowhere in the response until after
you submit.
