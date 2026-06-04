// ===========================================================================
// Question bank.
//
// Edit / expand here. Types are imported from `db/types.ts` (the canonical
// source). Phase 3 expands this list and adds FIB + matching formats.
//
// Each question carries:
//  - `difficulty`: displayed bucket (easy/medium/hard) the recipe slots on.
//  - `intrinsic` ∈ [0, 1]: HIDDEN authored difficulty. Expected accuracy of a
//    competent fan (skill ≈ 0.7). Used ONLY by bot pCorrect math — never the
//    displayed difficulty engine. Keeping these two independent is what lets
//    the difficulty engine measure something real instead of confirming its
//    own labels. See PLAN.md "Difficulty engine" section.
//
// Convention used here for intrinsic when authoring:
//   easy   ≈ 0.85, medium ≈ 0.55, hard ≈ 0.30
// Adjust freely per question — the engine is happy with arbitrary values.
//
// !! Integrity caveat: this bank is authored without external fact-checking.
//    See README.md and PLAN.md. Mark uncertain entries with `// REVIEW: ...`.
// ===========================================================================

import type { Question } from '../db/types';
export type { Question, Difficulty, Sport, QuestionType } from '../db/types';

export const QUESTIONS: Question[] = [
  // ----------------------------- EASY -----------------------------
  {
    id: 'nba-easy-1',
    type: 'multiple_choice',
    text: 'How many players from one team are on the basketball court at a time?',
    options: ['4', '5', '6', '7'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.92,
    sport: 'NBA',
  },
  {
    id: 'nba-easy-2',
    type: 'multiple_choice',
    text: 'Which NBA team plays its home games in Los Angeles and is called the Lakers?',
    options: ['Boston', 'Los Angeles', 'Chicago', 'Miami'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.90,
    sport: 'NBA',
  },
  {
    id: 'nfl-easy-1',
    type: 'multiple_choice',
    text: 'How many points is a touchdown worth (before the extra point)?',
    options: ['3', '6', '7', '2'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.88,
    sport: 'NFL',
  },
  {
    id: 'nfl-easy-2',
    type: 'multiple_choice',
    text: 'What is the championship game of the NFL called?',
    options: ['The Finals', 'The World Series', 'The Super Bowl', 'The Stanley Cup'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.93,
    sport: 'NFL',
  },
  {
    id: 'mlb-easy-1',
    type: 'multiple_choice',
    text: 'How many strikes make an out in baseball?',
    options: ['2', '3', '4', '1'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.90,
    sport: 'MLB',
  },
  {
    id: 'mlb-easy-2',
    type: 'multiple_choice',
    text: 'What is it called when a batter hits the ball over the outfield fence in fair territory?',
    options: ['Home run', 'Touchdown', 'Slam dunk', 'Birdie'],
    correctIndex: 0,
    difficulty: 'easy',
    intrinsic: 0.94,
    sport: 'MLB',
  },
  {
    id: 'soccer-easy-1',
    type: 'multiple_choice',
    text: 'How many players from one team are on a soccer field at a time?',
    options: ['9', '10', '11', '12'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.88,
    sport: 'Soccer',
  },
  {
    id: 'soccer-easy-2',
    type: 'multiple_choice',
    text: 'Which player on a soccer team is allowed to use their hands within the penalty area?',
    options: ['Striker', 'Goalkeeper', 'Midfielder', 'Defender'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.92,
    sport: 'Soccer',
  },
  {
    id: 'ufc-easy-1',
    type: 'multiple_choice',
    text: 'What does UFC stand for?',
    options: [
      'United Fighting Confederation',
      'Ultimate Fighting Championship',
      'Universal Fight Club',
      'United Fight Circuit',
    ],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.85,
    sport: 'UFC',
  },
  {
    id: 'ufc-easy-2',
    type: 'multiple_choice',
    text: 'What is the shape of the fighting area in the UFC commonly called?',
    options: ['The Ring', 'The Octagon', 'The Square', 'The Pit'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.88,
    sport: 'UFC',
  },
  {
    id: 'gen-easy-1',
    type: 'multiple_choice',
    text: 'How often are the modern Summer Olympic Games held?',
    options: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.88,
    sport: 'general',
  },
  {
    id: 'gen-easy-2',
    type: 'multiple_choice',
    text: 'In tennis, what is a score of zero called?',
    options: ['Nil', 'Love', 'Duck', 'Blank'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.78,
    sport: 'general',
  },

  // ----------------------------- MEDIUM -----------------------------
  {
    id: 'nba-med-1',
    type: 'multiple_choice',
    text: 'Which team did Michael Jordan win all six of his NBA championships with?',
    options: ['Washington Wizards', 'Chicago Bulls', 'New York Knicks', 'Los Angeles Lakers'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.74,
    sport: 'NBA',
  },
  {
    id: 'nba-med-2',
    type: 'multiple_choice',
    text: 'How many points is a shot made from beyond the three-point line worth?',
    options: ['2', '3', '4', '1'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.80,
    sport: 'NBA',
  },
  {
    id: 'nba-med-3',
    type: 'multiple_choice',
    // REVIEW: as of early 2026 LeBron James holds the regular-season scoring
    // record (passed Kareem in Feb 2023). Confirm the question wording matches
    // your preferred phrasing.
    text: 'Who is the NBA all-time leading scorer in the regular season?',
    options: ['Kareem Abdul-Jabbar', 'Karl Malone', 'LeBron James', 'Kobe Bryant'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.66,
    sport: 'NBA',
  },
  {
    id: 'nfl-med-1',
    type: 'multiple_choice',
    text: 'Which quarterback has won the most Super Bowls (7)?',
    options: ['Joe Montana', 'Tom Brady', 'Peyton Manning', 'Terry Bradshaw'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.78,
    sport: 'NFL',
  },
  {
    id: 'nfl-med-2',
    type: 'multiple_choice',
    text: 'How many yards must an offense gain to earn a new set of downs?',
    options: ['5', '10', '15', '20'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.75,
    sport: 'NFL',
  },
  {
    id: 'mlb-med-1',
    type: 'multiple_choice',
    text: 'How many bases must a runner touch (including home) to score a run?',
    options: ['3', '4', '5', '2'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.78,
    sport: 'MLB',
  },
  {
    id: 'mlb-med-2',
    type: 'multiple_choice',
    // REVIEW: Shohei Ohtani signed with the Dodgers in December 2023 and plays
    // for them from the 2024 season onward. Confirm before shipping rankings.
    text: 'For which team did Shohei Ohtani play from the 2024 season onward?',
    options: ['Los Angeles Angels', 'Los Angeles Dodgers', 'New York Yankees', 'Seattle Mariners'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'MLB',
  },
  {
    id: 'soccer-med-1',
    type: 'multiple_choice',
    text: 'How often is the FIFA World Cup held?',
    options: ['Every 2 years', 'Every 4 years', 'Every 3 years', 'Every year'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.82,
    sport: 'Soccer',
  },
  {
    id: 'soccer-med-2',
    type: 'multiple_choice',
    text: 'Which national team won the 2022 FIFA World Cup?',
    options: ['France', 'Brazil', 'Argentina', 'Germany'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.66,
    sport: 'Soccer',
  },
  {
    id: 'ufc-med-1',
    type: 'multiple_choice',
    // REVIEW: Conor McGregor became the first simultaneous two-division UFC
    // champion in Nov 2016 (featherweight + lightweight). Confirm wording.
    text: 'Which fighter was the first to hold UFC titles in two weight classes simultaneously?',
    options: ['Daniel Cormier', 'Conor McGregor', 'Amanda Nunes', 'Georges St-Pierre'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'UFC',
  },
  {
    id: 'gen-med-1',
    type: 'multiple_choice',
    text: 'In golf, what is the term for one stroke under par on a hole?',
    options: ['Eagle', 'Birdie', 'Bogey', 'Par'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.70,
    sport: 'general',
  },
  {
    id: 'gen-med-2',
    type: 'multiple_choice',
    text: 'How many Grand Slam tournaments are there in professional tennis each year?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.62,
    sport: 'general',
  },

  // ----------------------------- HARD -----------------------------
  {
    id: 'nba-hard-1',
    type: 'multiple_choice',
    text: 'Who holds the NBA record for most points scored in a single game (100)?',
    options: ['Wilt Chamberlain', 'Kobe Bryant', 'Michael Jordan', 'David Thompson'],
    correctIndex: 0,
    difficulty: 'hard',
    intrinsic: 0.42,
    sport: 'NBA',
  },
  {
    id: 'nfl-hard-1',
    type: 'multiple_choice',
    text: 'Which team completed the only perfect season in NFL history, finishing the regular season + playoffs 17-0?',
    options: ['1985 Chicago Bears', '1972 Miami Dolphins', '2007 New England Patriots', '1962 Green Bay Packers'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.38,
    sport: 'NFL',
  },
  {
    id: 'mlb-hard-1',
    type: 'multiple_choice',
    text: 'Who holds the MLB single-season home run record (73)?',
    options: ['Mark McGwire', 'Sammy Sosa', 'Barry Bonds', 'Babe Ruth'],
    correctIndex: 2,
    difficulty: 'hard',
    intrinsic: 0.40,
    sport: 'MLB',
  },
  {
    id: 'soccer-hard-1',
    type: 'multiple_choice',
    text: 'Which country has won the most FIFA World Cup titles?',
    options: ['Germany', 'Italy', 'Argentina', 'Brazil'],
    correctIndex: 3,
    difficulty: 'hard',
    intrinsic: 0.48,
    sport: 'Soccer',
  },
  {
    id: 'ufc-hard-1',
    type: 'multiple_choice',
    // REVIEW: Ronda Rousey headlined UFC 157 in Feb 2013 as the first women's
    // UFC fight; she was champion at the time. Confirm wording.
    text: 'Who was the first woman to fight in the UFC, headlining UFC 157 in 2013?',
    options: ['Amanda Nunes', 'Ronda Rousey', 'Holly Holm', 'Valentina Shevchenko'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.42,
    sport: 'UFC',
  },
  {
    id: 'gen-hard-1',
    type: 'multiple_choice',
    text: 'In the Tour de France, what color is the jersey worn by the overall race leader?',
    options: ['Green', 'Polka dot', 'Yellow', 'White'],
    correctIndex: 2,
    difficulty: 'hard',
    intrinsic: 0.45,
    sport: 'general',
  },
];
