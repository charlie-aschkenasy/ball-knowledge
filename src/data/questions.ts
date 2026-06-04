// ---------------------------------------------------------------------------
// Question bank.
//
// This is the single place to edit or expand the trivia questions.
// Each question is multiple choice with exactly 4 options. The data model is
// intentionally shaped so other question types can be added later (see `type`).
//
// To add a question: copy an existing entry, give it a unique `id`, set the
// `correctIndex` to the position (0-3) of the right answer in `options`, and
// tag it with a `difficulty` and `sport`.
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Sport = 'NBA' | 'NFL' | 'UFC' | 'MLB' | 'Soccer' | 'general';

/** Reserved for future question formats. Only multiple_choice in this MVP. */
export type QuestionType = 'multiple_choice';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  /** Exactly 4 options for multiple choice. */
  options: [string, string, string, string];
  /** Index (0-3) into `options` of the correct answer. */
  correctIndex: number;
  difficulty: Difficulty;
  sport: Sport;
}

export const QUESTIONS: Question[] = [
  // ----------------------------- EASY -----------------------------
  {
    id: 'nba-easy-1',
    type: 'multiple_choice',
    text: 'How many players from one team are on the basketball court at a time?',
    options: ['4', '5', '6', '7'],
    correctIndex: 1,
    difficulty: 'easy',
    sport: 'NBA',
  },
  {
    id: 'nba-easy-2',
    type: 'multiple_choice',
    text: 'Which NBA team has the nickname "the Lakers"?',
    options: ['Boston', 'Los Angeles', 'Chicago', 'Miami'],
    correctIndex: 1,
    difficulty: 'easy',
    sport: 'NBA',
  },
  {
    id: 'nfl-easy-1',
    type: 'multiple_choice',
    text: 'How many points is a touchdown worth (before the extra point)?',
    options: ['3', '6', '7', '2'],
    correctIndex: 1,
    difficulty: 'easy',
    sport: 'NFL',
  },
  {
    id: 'nfl-easy-2',
    type: 'multiple_choice',
    text: 'What is the championship game of the NFL called?',
    options: ['The Finals', 'The World Series', 'The Super Bowl', 'The Stanley Cup'],
    correctIndex: 2,
    difficulty: 'easy',
    sport: 'NFL',
  },
  {
    id: 'mlb-easy-1',
    type: 'multiple_choice',
    text: 'How many strikes make an out in baseball?',
    options: ['2', '3', '4', '1'],
    correctIndex: 1,
    difficulty: 'easy',
    sport: 'MLB',
  },
  {
    id: 'mlb-easy-2',
    type: 'multiple_choice',
    text: 'What is it called when a batter hits the ball over the outfield fence in fair territory?',
    options: ['Home run', 'Touchdown', 'Slam dunk', 'Birdie'],
    correctIndex: 0,
    difficulty: 'easy',
    sport: 'MLB',
  },
  {
    id: 'soccer-easy-1',
    type: 'multiple_choice',
    text: 'How many players from one team are on a soccer field at a time?',
    options: ['9', '10', '11', '12'],
    correctIndex: 2,
    difficulty: 'easy',
    sport: 'Soccer',
  },
  {
    id: 'soccer-easy-2',
    type: 'multiple_choice',
    text: 'Which player on a soccer team is allowed to use their hands within the penalty area?',
    options: ['Striker', 'Goalkeeper', 'Midfielder', 'Defender'],
    correctIndex: 1,
    difficulty: 'easy',
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
    sport: 'UFC',
  },
  {
    id: 'ufc-easy-2',
    type: 'multiple_choice',
    text: 'What shape is the fighting area in the UFC commonly called?',
    options: ['The Ring', 'The Octagon', 'The Square', 'The Pit'],
    correctIndex: 1,
    difficulty: 'easy',
    sport: 'UFC',
  },
  {
    id: 'gen-easy-1',
    type: 'multiple_choice',
    text: 'How often are the modern Summer Olympic Games held?',
    options: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'],
    correctIndex: 2,
    difficulty: 'easy',
    sport: 'general',
  },
  {
    id: 'gen-easy-2',
    type: 'multiple_choice',
    text: 'In tennis, what is a score of zero called?',
    options: ['Nil', 'Love', 'Duck', 'Blank'],
    correctIndex: 1,
    difficulty: 'easy',
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
    sport: 'NBA',
  },
  {
    id: 'nba-med-2',
    type: 'multiple_choice',
    text: 'How many points is a shot made from beyond the three-point line worth?',
    options: ['2', '3', '4', '1'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'NBA',
  },
  {
    id: 'nba-med-3',
    type: 'multiple_choice',
    text: 'Which player is the NBA all-time leading scorer in the regular season (as of 2024)?',
    options: ['Kareem Abdul-Jabbar', 'Karl Malone', 'LeBron James', 'Kobe Bryant'],
    correctIndex: 2,
    difficulty: 'medium',
    sport: 'NBA',
  },
  {
    id: 'nfl-med-1',
    type: 'multiple_choice',
    text: 'Which quarterback has won the most Super Bowls?',
    options: ['Joe Montana', 'Tom Brady', 'Peyton Manning', 'Terry Bradshaw'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'NFL',
  },
  {
    id: 'nfl-med-2',
    type: 'multiple_choice',
    text: 'How many yards must an offense gain to earn a new set of downs?',
    options: ['5', '10', '15', '20'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'NFL',
  },
  {
    id: 'mlb-med-1',
    type: 'multiple_choice',
    text: 'How many bases must a runner touch to score a run?',
    options: ['3', '4', '5', '2'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'MLB',
  },
  {
    id: 'mlb-med-2',
    type: 'multiple_choice',
    text: 'Which team does pitcher and hitter Shohei Ohtani play for as of the 2024 season?',
    options: ['Los Angeles Angels', 'Los Angeles Dodgers', 'New York Yankees', 'Seattle Mariners'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'MLB',
  },
  {
    id: 'soccer-med-1',
    type: 'multiple_choice',
    text: 'How often is the FIFA World Cup held?',
    options: ['Every 2 years', 'Every 4 years', 'Every 3 years', 'Every year'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'Soccer',
  },
  {
    id: 'soccer-med-2',
    type: 'multiple_choice',
    text: 'Which national team won the 2022 FIFA World Cup?',
    options: ['France', 'Brazil', 'Argentina', 'Germany'],
    correctIndex: 2,
    difficulty: 'medium',
    sport: 'Soccer',
  },
  {
    id: 'ufc-med-1',
    type: 'multiple_choice',
    text: 'Which fighter was the first to hold UFC titles in two weight classes simultaneously?',
    options: ['Daniel Cormier', 'Conor McGregor', 'Amanda Nunes', 'Georges St-Pierre'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'UFC',
  },
  {
    id: 'gen-med-1',
    type: 'multiple_choice',
    text: 'In golf, what is the term for one stroke under par on a hole?',
    options: ['Eagle', 'Birdie', 'Bogey', 'Par'],
    correctIndex: 1,
    difficulty: 'medium',
    sport: 'general',
  },
  {
    id: 'gen-med-2',
    type: 'multiple_choice',
    text: 'How many Grand Slam tournaments are there in professional tennis each year?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    difficulty: 'medium',
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
    sport: 'NBA',
  },
  {
    id: 'nfl-hard-1',
    type: 'multiple_choice',
    text: 'Which team completed the only perfect season in NFL history, finishing 17-0?',
    options: ['1985 Chicago Bears', '1972 Miami Dolphins', '2007 New England Patriots', '1962 Green Bay Packers'],
    correctIndex: 1,
    difficulty: 'hard',
    sport: 'NFL',
  },
  {
    id: 'mlb-hard-1',
    type: 'multiple_choice',
    text: 'Who holds the MLB single-season home run record (73)?',
    options: ['Mark McGwire', 'Sammy Sosa', 'Barry Bonds', 'Babe Ruth'],
    correctIndex: 2,
    difficulty: 'hard',
    sport: 'MLB',
  },
  {
    id: 'soccer-hard-1',
    type: 'multiple_choice',
    text: 'Which country has won the most FIFA World Cup titles?',
    options: ['Germany', 'Italy', 'Argentina', 'Brazil'],
    correctIndex: 3,
    difficulty: 'hard',
    sport: 'Soccer',
  },
  {
    id: 'ufc-hard-1',
    type: 'multiple_choice',
    text: 'Who was the first woman to fight in the UFC, headlining UFC 157 in 2013?',
    options: ['Amanda Nunes', 'Ronda Rousey', 'Holly Holm', 'Valentina Shevchenko'],
    correctIndex: 1,
    difficulty: 'hard',
    sport: 'UFC',
  },
  {
    id: 'gen-hard-1',
    type: 'multiple_choice',
    text: 'In cycling, what color is the jersey worn by the overall leader of the Tour de France?',
    options: ['Green', 'Polka dot', 'Yellow', 'White'],
    correctIndex: 2,
    difficulty: 'hard',
    sport: 'general',
  },
];
