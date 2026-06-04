# Ball Knowledge

A daily sports trivia game. Think "BeReal for sports knowledge": answer a short
set of recall questions once per day, earn points, build a running rating, and
climb the leaderboard.

This is an early MVP. It runs entirely in the browser with no backend, no
accounts, and no API calls. Your progress is saved to the browser via
`localStorage`, so a refresh won't wipe your score.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- Plain CSS (mobile-first)
- `localStorage` for persistence

## Run it locally

You need [Node.js](https://nodejs.org/) (18+ recommended).

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To build a production bundle:

```bash
npm run build
npm run preview
```

## How to play

- One quiz per day, 5 questions (2 easy, 2 medium, 1 hard).
- Multiple choice, 4 options each, with a 15-second timer per question.
- Correct answers earn points; wrong/timed-out answers earn nothing.
- After finishing you see your results and your spot on the leaderboard.
- You can only play once per day. To replay while testing, use the
  **DEV: Reset day** button on the Home screen.

## Where to tweak things

| What | File |
| --- | --- |
| Points per question, timer length, quiz size, difficulty recipe | [`src/config.ts`](src/config.ts) |
| Question bank (add / edit / expand questions) | [`src/data/questions.ts`](src/data/questions.ts) |
| Scoring logic | [`src/lib/scoring.ts`](src/lib/scoring.ts) |
| Daily quiz selection | [`src/lib/quiz.ts`](src/lib/quiz.ts) |
| Leaderboard seed players & ranking | [`src/lib/leaderboard.ts`](src/lib/leaderboard.ts) |
| Saved player state / daily lock | [`src/lib/storage.ts`](src/lib/storage.ts) |

### Adding a question

Open [`src/data/questions.ts`](src/data/questions.ts) and copy an existing entry:

```ts
{
  id: 'unique-id-here',
  type: 'multiple_choice',
  text: 'Your question?',
  options: ['A', 'B', 'C', 'D'], // exactly 4
  correctIndex: 0,              // 0-3, which option is correct
  difficulty: 'easy',          // 'easy' | 'medium' | 'hard'
  sport: 'NBA',                // 'NBA' | 'NFL' | 'UFC' | 'MLB' | 'Soccer' | 'general'
}
```

The sport tag is for future grouping; the MVP mixes sports freely. The starter
bank ships with ~30 sample questions you should review and replace as you like.

## Screens

- **Home** - today's status, your rating, leaderboard link, dev reset button.
- **Quiz** - one question at a time with a visible countdown timer.
- **Results** - how many you got right, points earned, new total rating.
- **Leaderboard** - everyone ranked by total points, with you highlighted.

## Out of scope (intentionally)

No accounts/auth, friend groups, AI-generated questions, crowdsourced
difficulty, or non-multiple-choice formats. Just a clean daily ritual.
