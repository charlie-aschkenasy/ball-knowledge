# Ball Knowledge — Build Progress Tracker

> Checklist for the whole build. **Tell me what you finished and I'll tick it +
> update the bar** — you don't maintain this yourself.
> Legend: `[x]` done · `[ ]` not started · 🔵 = current focus.
> Last updated: June 27, 2026

## Overall progress

`█████████░░░░░░░░░░░░` **16 / 35 steps (46%)**

| Phase | Status |
| --- | --- |
| 0. Decisions locked | ✅ Done |
| Prototype baseline | ✅ Done |
| 1. Server-authoritative core (web) | ✅ Done |
| 2. Content pipeline + bank | ⬜ Not started |
| 3. Go native (Expo) | ⬜ Not started |
| 4. TestFlight / Play beta | ⬜ Not started |
| 5. App Store launch | ⬜ Not started |
| 6. Friend graph (post-launch) | ⬜ Not started |

**🔵 Current focus:** Phase 2 → content pipeline (draft → verify → store) and banking 30–60 days of verified sets. (Automated publishing now keeps a rolling 7-day buffer from the existing verified pool.)

---

## Phase 0 — Decisions locked ✅

- [x] Question model: shared daily set
- [x] Backend: Supabase
- [x] Native path: React Native + Expo
- [x] Anti-cheat scope: timer + app-switch (nothing invasive at launch)
- [x] Bots: local design aid only, never shipped
- [x] Launch via App Store; beta via TestFlight first

## Prototype baseline ✅

- [x] Single-player prototype built (UI, question formats, scoring, styling)

---

## Phase 1 — Server-authoritative core (still on web)

- [x] Supabase project created + schema (profiles, questions, daily_sets, submissions)
- [x] Auth set up (email to start)
- [x] Questions served without the correct answer
- [x] Grading Edge Function (server grades + writes score + reveals answers post-submit)
- [x] Per-answer analytics captured (answer_events + question_stats) for difficulty/points tuning
- [x] Server time drives the clock — UTC daily rollover via automated publishing
      (`pg_cron` banks a rolling 7-day buffer) + server-anchored timer that hard-rejects
      late submissions. (Morning/evening drop *windows* deferred — not needed yet.)
- [x] Screens repointed from localStorage → Supabase via the repo seam
- [x] Bots removed + cold-start empty states built — legacy sim/bot layer deleted
      (was already tree-shaken out of the bundle); friendly empty / "not live yet" /
      "time's up" states added
- [x] ✅ Phase 1 gate passed (all confirm-checks in the plan are true)

## Phase 2 — Content pipeline + bank

- [~] Draft → verify → store pipeline built — in-app user-submission flow live
      (propose → AI generates answer+options+source via Claude → admin approves into
      the bank). Generation needs the ANTHROPIC_API_KEY secret to activate; bulk
      OpenTDB/stat authoring deferred.
- [x] 30–60 days of verified sets banked — buffer raised to 30 days; prod holds 32.
- [x] Daily publish pulls only `verified = true` questions (done in Phase 1).
- [ ] ✅ Phase 2 gate passed — remaining: real `source_url` per question, full
      correctness pass (random 30-sample audited clean; 1 quality flag: q0057 has a
      duplicate option).

## Phase 3 — Go native (Expo)

- [ ] Ported to React Native + Expo
- [ ] Push notifications (daily-drop reminder)
- [ ] App-switch detection (`AppState`)
- [ ] Sign in with Apple (+ Google if desired)
- [ ] ✅ Phase 3 gate passed (full loop works on a real device)

## Phase 4 — TestFlight / Play internal beta

- [ ] Distributed to friends/family via TestFlight + Play internal testing
- [ ] Feedback gathered + core loop fixes made
- [ ] ✅ Phase 4 gate passed (real humans playing across multiple days, good retention signal)

## Phase 5 — App Store + Play launch

- [ ] Store listings, screenshots, privacy labels
- [ ] Submitted + review feedback addressed
- [ ] ✅ Approved on both stores — publicly downloadable 🚀

## Phase 6 — Friend graph (post-launch)

- [ ] Invite-link leagues
- [ ] Username search
- [ ] Contacts-based friends
- [ ] (Optional) unranked practice mode
