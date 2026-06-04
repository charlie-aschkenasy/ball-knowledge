// ===========================================================================
// Question bank.
//
// Edit / expand here. Types live in `db/types.ts` (the canonical source).
//
// Each question carries:
//  - `difficulty`: displayed bucket (easy / medium / hard) the recipe slots on.
//  - `intrinsic` ∈ [0, 1]: HIDDEN authored difficulty. Expected accuracy of a
//    competent fan (skill ≈ 0.7). Used ONLY by bot pCorrect math — never the
//    displayed difficulty engine. Keeping these independent lets the engine
//    measure a real signal instead of confirming its own labels.
//    See PLAN.md "Difficulty engine".
//
// Convention used here for intrinsic when authoring:
//   easy   ≈ 0.85 (range 0.78–0.94)
//   medium ≈ 0.60 (range 0.50–0.72)
//   hard   ≈ 0.38 (range 0.25–0.50)
// Adjust freely per question.
//
// !! Integrity caveat: this bank is authored without external fact-checking.
//    Lines beginning with `// REVIEW:` flag claims you should verify before
//    trusting the rankings.
//
// Phase 7 adds fill_in_blank and matching formats. For now, all entries are
// multiple_choice.
// ===========================================================================

import type { Question } from '../db/types';
export type { Question, Difficulty, Sport, QuestionType } from '../db/types';

export const QUESTIONS: Question[] = [
  // =============================================================
  // NBA
  // =============================================================

  // ----- NBA easy -----
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
    text: 'In which U.S. city do the NBA team known as the Lakers play their home games?',
    options: ['Boston', 'Los Angeles', 'Chicago', 'Miami'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.90,
    sport: 'NBA',
  },
  {
    id: 'nba-easy-3',
    type: 'multiple_choice',
    text: 'How many points is a standard free throw worth in basketball?',
    options: ['1', '2', '3', '0'],
    correctIndex: 0,
    difficulty: 'easy',
    intrinsic: 0.86,
    sport: 'NBA',
  },
  {
    id: 'nba-easy-4',
    type: 'multiple_choice',
    text: 'What is the name of the championship trophy awarded to the NBA champion?',
    options: ['Stanley Cup', 'Larry O’Brien Trophy', 'Vince Lombardi Trophy', 'Commissioner’s Trophy'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.78,
    sport: 'NBA',
  },
  {
    id: 'nba-easy-5',
    type: 'multiple_choice',
    text: 'How many quarters are played in a standard NBA game?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.90,
    sport: 'NBA',
  },

  // ----- NBA medium -----
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
    // REVIEW: LeBron James passed Kareem Abdul-Jabbar in Feb 2023 for the NBA
    // regular-season scoring record. Confirm.
    text: 'Who is the NBA all-time leading scorer in the regular season?',
    options: ['Kareem Abdul-Jabbar', 'Karl Malone', 'LeBron James', 'Kobe Bryant'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.66,
    sport: 'NBA',
  },
  {
    id: 'nba-med-4',
    type: 'multiple_choice',
    text: 'How long, in minutes, is each quarter of an NBA game?',
    options: ['10', '12', '15', '20'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.70,
    sport: 'NBA',
  },
  {
    id: 'nba-med-5',
    type: 'multiple_choice',
    text: 'Which team did Larry Bird play his entire NBA career for?',
    options: ['Detroit Pistons', 'Boston Celtics', 'Philadelphia 76ers', 'Indiana Pacers'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.62,
    sport: 'NBA',
  },
  {
    id: 'nba-med-6',
    type: 'multiple_choice',
    text: 'Which player’s nickname is "The Black Mamba"?',
    options: ['Allen Iverson', 'Kobe Bryant', 'Kevin Garnett', 'Tracy McGrady'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.72,
    sport: 'NBA',
  },

  // ----- NBA hard -----
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
    id: 'nba-hard-2',
    type: 'multiple_choice',
    // REVIEW: Bill Russell won 11 championships as a player with the Celtics
    // (1957, 1959–1966, 1968, 1969). Confirm the wording.
    text: 'Which player won the most NBA championships as a player (11)?',
    options: ['Bill Russell', 'Sam Jones', 'Kareem Abdul-Jabbar', 'Michael Jordan'],
    correctIndex: 0,
    difficulty: 'hard',
    intrinsic: 0.38,
    sport: 'NBA',
  },
  {
    id: 'nba-hard-3',
    type: 'multiple_choice',
    // REVIEW: Stephen Curry holds the NBA single-season three-pointers record.
    // He set it at 402 in the 2015–16 season. Confirm.
    text: 'Who holds the NBA single-season record for three-pointers made?',
    options: ['Klay Thompson', 'Stephen Curry', 'James Harden', 'Damian Lillard'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.45,
    sport: 'NBA',
  },
  {
    id: 'nba-hard-4',
    type: 'multiple_choice',
    text: 'Which team drafted Kobe Bryant 13th overall in the 1996 NBA Draft before trading him to the Lakers?',
    options: ['Phoenix Suns', 'Charlotte Hornets', 'Toronto Raptors', 'Sacramento Kings'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.30,
    sport: 'NBA',
  },

  // =============================================================
  // NFL
  // =============================================================

  // ----- NFL easy -----
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
    text: 'What is the name of the championship game of the NFL?',
    options: ['The Finals', 'The World Series', 'The Super Bowl', 'The Stanley Cup'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.93,
    sport: 'NFL',
  },
  {
    id: 'nfl-easy-3',
    type: 'multiple_choice',
    text: 'How many players from one team are on the field at a time during an NFL play?',
    options: ['9', '10', '11', '12'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.84,
    sport: 'NFL',
  },
  {
    id: 'nfl-easy-4',
    type: 'multiple_choice',
    text: 'Which position is responsible for throwing passes on offense?',
    options: ['Running back', 'Wide receiver', 'Quarterback', 'Tight end'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.90,
    sport: 'NFL',
  },
  {
    id: 'nfl-easy-5',
    type: 'multiple_choice',
    text: 'How many points is a field goal worth?',
    options: ['1', '2', '3', '6'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.84,
    sport: 'NFL',
  },

  // ----- NFL medium -----
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
    id: 'nfl-med-3',
    type: 'multiple_choice',
    text: 'How many points is a safety worth in football?',
    options: ['1', '2', '3', '6'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'NFL',
  },
  {
    id: 'nfl-med-4',
    type: 'multiple_choice',
    text: 'Which two NFL teams played in Super Bowl I?',
    options: [
      'Packers and Chiefs',
      'Colts and Jets',
      'Steelers and Vikings',
      'Cowboys and Dolphins',
    ],
    correctIndex: 0,
    difficulty: 'medium',
    intrinsic: 0.50,
    sport: 'NFL',
  },
  {
    id: 'nfl-med-5',
    type: 'multiple_choice',
    text: 'Which team did Walter Payton spend his entire NFL career with?',
    options: ['Dallas Cowboys', 'Chicago Bears', 'Detroit Lions', 'Green Bay Packers'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.60,
    sport: 'NFL',
  },
  {
    id: 'nfl-med-6',
    type: 'multiple_choice',
    text: 'How many divisions are there in each NFL conference (AFC and NFC)?',
    options: ['2', '3', '4', '5'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.62,
    sport: 'NFL',
  },

  // ----- NFL hard -----
  {
    id: 'nfl-hard-1',
    type: 'multiple_choice',
    text: 'Which team completed the only perfect undefeated NFL season (regular season + playoffs, 17-0)?',
    options: [
      '1985 Chicago Bears',
      '1972 Miami Dolphins',
      '2007 New England Patriots',
      '1962 Green Bay Packers',
    ],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.45,
    sport: 'NFL',
  },
  {
    id: 'nfl-hard-2',
    type: 'multiple_choice',
    // REVIEW: Emmitt Smith holds the NFL career rushing yards record (18,355).
    text: 'Who holds the NFL career rushing yards record?',
    options: ['Walter Payton', 'Emmitt Smith', 'Barry Sanders', 'Adrian Peterson'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.40,
    sport: 'NFL',
  },
  {
    id: 'nfl-hard-3',
    type: 'multiple_choice',
    // REVIEW: Jerry Rice is the all-time leader in receiving yards and TDs.
    text: 'Who is the NFL’s all-time leader in career receiving yards?',
    options: ['Jerry Rice', 'Larry Fitzgerald', 'Terrell Owens', 'Randy Moss'],
    correctIndex: 0,
    difficulty: 'hard',
    intrinsic: 0.50,
    sport: 'NFL',
  },
  {
    id: 'nfl-hard-4',
    type: 'multiple_choice',
    text: 'Which NFL franchise has won the most Super Bowls (tied at 6 with one other)?',
    options: ['Dallas Cowboys', 'Pittsburgh Steelers', 'San Francisco 49ers', 'Green Bay Packers'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.35,
    sport: 'NFL',
  },

  // =============================================================
  // MLB
  // =============================================================

  // ----- MLB easy -----
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
    id: 'mlb-easy-3',
    type: 'multiple_choice',
    text: 'How many innings are in a standard MLB game (assuming no extras)?',
    options: ['7', '8', '9', '10'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.84,
    sport: 'MLB',
  },
  {
    id: 'mlb-easy-4',
    type: 'multiple_choice',
    text: 'What is the name of the championship series in Major League Baseball?',
    options: ['Stanley Cup', 'World Series', 'Champions League', 'NBA Finals'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.92,
    sport: 'MLB',
  },
  {
    id: 'mlb-easy-5',
    type: 'multiple_choice',
    text: 'How many balls earn a batter a walk?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.82,
    sport: 'MLB',
  },

  // ----- MLB medium -----
  {
    id: 'mlb-med-1',
    type: 'multiple_choice',
    text: 'How many bases (including home) must a runner touch to score a run?',
    options: ['3', '4', '5', '2'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.78,
    sport: 'MLB',
  },
  {
    id: 'mlb-med-2',
    type: 'multiple_choice',
    // REVIEW: Shohei Ohtani signed with the Dodgers Dec 2023; plays for them
    // 2024 onward.
    text: 'For which team did Shohei Ohtani play from the 2024 season onward?',
    options: ['Los Angeles Angels', 'Los Angeles Dodgers', 'New York Yankees', 'Seattle Mariners'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'MLB',
  },
  {
    id: 'mlb-med-3',
    type: 'multiple_choice',
    text: 'How many teams are in Major League Baseball?',
    options: ['28', '30', '32', '34'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.62,
    sport: 'MLB',
  },
  {
    id: 'mlb-med-4',
    type: 'multiple_choice',
    text: 'Which famous Yankees player wore the number 42 and had it retired league-wide?',
    options: ['Babe Ruth', 'Lou Gehrig', 'Jackie Robinson', 'Mickey Mantle'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'MLB',
  },
  {
    id: 'mlb-med-5',
    type: 'multiple_choice',
    text: 'Which MLB team has won the most World Series titles?',
    options: ['Boston Red Sox', 'New York Yankees', 'St. Louis Cardinals', 'Los Angeles Dodgers'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.68,
    sport: 'MLB',
  },
  {
    id: 'mlb-med-6',
    type: 'multiple_choice',
    text: 'What term describes when a pitcher gets three strikeouts in one inning on nine pitches?',
    options: ['Perfect inning', 'Immaculate inning', 'Triple play', 'Cycle'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.50,
    sport: 'MLB',
  },

  // ----- MLB hard -----
  {
    id: 'mlb-hard-1',
    type: 'multiple_choice',
    text: 'Who holds the MLB single-season home run record (73)?',
    options: ['Mark McGwire', 'Sammy Sosa', 'Barry Bonds', 'Babe Ruth'],
    correctIndex: 2,
    difficulty: 'hard',
    intrinsic: 0.42,
    sport: 'MLB',
  },
  {
    id: 'mlb-hard-2',
    type: 'multiple_choice',
    text: 'Who holds the MLB career hits record (4,256)?',
    options: ['Ty Cobb', 'Pete Rose', 'Hank Aaron', 'Stan Musial'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.35,
    sport: 'MLB',
  },
  {
    id: 'mlb-hard-3',
    type: 'multiple_choice',
    text: 'In what year did MLB integrate when Jackie Robinson debuted with the Brooklyn Dodgers?',
    options: ['1942', '1947', '1951', '1955'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.40,
    sport: 'MLB',
  },
  {
    id: 'mlb-hard-4',
    type: 'multiple_choice',
    // REVIEW: Cy Young holds the all-time career wins record (511).
    text: 'Who holds the MLB career wins record for a pitcher (511)?',
    options: ['Walter Johnson', 'Cy Young', 'Nolan Ryan', 'Greg Maddux'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.32,
    sport: 'MLB',
  },

  // =============================================================
  // UFC
  // =============================================================

  // ----- UFC easy -----
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
    text: 'What is the shape of the UFC fighting area commonly called?',
    options: ['The Ring', 'The Octagon', 'The Square', 'The Pit'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.88,
    sport: 'UFC',
  },
  {
    id: 'ufc-easy-3',
    type: 'multiple_choice',
    text: 'How many minutes long is a standard non-title round in the UFC?',
    options: ['3', '5', '7', '10'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.78,
    sport: 'UFC',
  },
  {
    id: 'ufc-easy-4',
    type: 'multiple_choice',
    text: 'How many rounds does a championship UFC fight have?',
    options: ['3', '5', '7', '10'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.78,
    sport: 'UFC',
  },

  // ----- UFC medium -----
  {
    id: 'ufc-med-1',
    type: 'multiple_choice',
    // REVIEW: Conor McGregor became the first simultaneous two-division UFC
    // champion in Nov 2016 (FW + LW).
    text: 'Which fighter was the first to hold UFC titles in two weight classes simultaneously?',
    options: ['Daniel Cormier', 'Conor McGregor', 'Amanda Nunes', 'Georges St-Pierre'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'UFC',
  },
  {
    id: 'ufc-med-2',
    type: 'multiple_choice',
    // REVIEW: Khabib Nurmagomedov retired at 29-0 in October 2020.
    text: 'Which UFC lightweight champion retired with a perfect 29-0 MMA record in 2020?',
    options: ['Khabib Nurmagomedov', 'Conor McGregor', 'Tony Ferguson', 'Justin Gaethje'],
    correctIndex: 0,
    difficulty: 'medium',
    intrinsic: 0.60,
    sport: 'UFC',
  },
  {
    id: 'ufc-med-3',
    type: 'multiple_choice',
    text: 'Which fighting style focuses primarily on ground grappling and submissions, and is core to MMA?',
    options: ['Muay Thai', 'Boxing', 'Brazilian Jiu-Jitsu', 'Taekwondo'],
    correctIndex: 2,
    difficulty: 'medium',
    intrinsic: 0.68,
    sport: 'UFC',
  },
  {
    id: 'ufc-med-4',
    type: 'multiple_choice',
    text: 'Which UFC weight class has an upper limit of 155 pounds?',
    options: ['Featherweight', 'Lightweight', 'Welterweight', 'Bantamweight'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.50,
    sport: 'UFC',
  },
  {
    id: 'ufc-med-5',
    type: 'multiple_choice',
    text: 'What does "TKO" stand for in MMA result terminology?',
    options: [
      'Total Knockout',
      'Technical Knockout',
      'Timed Knockout',
      'Throwing Knockout',
    ],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.66,
    sport: 'UFC',
  },

  // ----- UFC hard -----
  {
    id: 'ufc-hard-1',
    type: 'multiple_choice',
    // REVIEW: Ronda Rousey headlined UFC 157 in Feb 2013 — first women’s fight.
    text: 'Who was the first woman to fight in the UFC, headlining UFC 157 in 2013?',
    options: ['Amanda Nunes', 'Ronda Rousey', 'Holly Holm', 'Valentina Shevchenko'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.42,
    sport: 'UFC',
  },
  {
    id: 'ufc-hard-2',
    type: 'multiple_choice',
    // REVIEW: Amanda Nunes is the first woman to be a two-division UFC champion
    // (BW + FW, 2018).
    text: 'Who was the first woman to be a two-division UFC champion simultaneously?',
    options: ['Ronda Rousey', 'Amanda Nunes', 'Holly Holm', 'Joanna Jędrzejczyk'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.40,
    sport: 'UFC',
  },
  {
    id: 'ufc-hard-3',
    type: 'multiple_choice',
    text: 'In what year was the first ever UFC event (UFC 1) held?',
    options: ['1989', '1993', '1996', '2000'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.35,
    sport: 'UFC',
  },

  // =============================================================
  // Soccer
  // =============================================================

  // ----- Soccer easy -----
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
    id: 'soccer-easy-3',
    type: 'multiple_choice',
    text: 'How long is a standard soccer match (in minutes, excluding stoppage and extra time)?',
    options: ['80', '90', '100', '120'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.85,
    sport: 'Soccer',
  },
  {
    id: 'soccer-easy-4',
    type: 'multiple_choice',
    text: 'What card does a referee show for a serious foul that results in a player being sent off?',
    options: ['Yellow', 'Red', 'Blue', 'Black'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.90,
    sport: 'Soccer',
  },
  {
    id: 'soccer-easy-5',
    type: 'multiple_choice',
    text: 'What is the most prestigious international soccer tournament for national teams?',
    options: ['Champions League', 'World Cup', 'Europa League', 'Copa America'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.88,
    sport: 'Soccer',
  },

  // ----- Soccer medium -----
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
    id: 'soccer-med-3',
    type: 'multiple_choice',
    text: 'Which English club is nicknamed "The Red Devils"?',
    options: ['Liverpool', 'Manchester United', 'Arsenal', 'Chelsea'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.70,
    sport: 'Soccer',
  },
  {
    id: 'soccer-med-4',
    type: 'multiple_choice',
    text: 'In what country is the soccer club FC Barcelona based?',
    options: ['Italy', 'Spain', 'Portugal', 'France'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.78,
    sport: 'Soccer',
  },
  {
    id: 'soccer-med-5',
    type: 'multiple_choice',
    text: 'Which trophy is awarded to the winner of UEFA’s top European club competition?',
    options: ['Europa League trophy', 'Champions League trophy', 'World Cup', 'Ballon d’Or'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.66,
    sport: 'Soccer',
  },

  // ----- Soccer hard -----
  {
    id: 'soccer-hard-1',
    type: 'multiple_choice',
    text: 'Which country has won the most FIFA World Cup titles (5)?',
    options: ['Germany', 'Italy', 'Argentina', 'Brazil'],
    correctIndex: 3,
    difficulty: 'hard',
    intrinsic: 0.48,
    sport: 'Soccer',
  },
  {
    id: 'soccer-hard-2',
    type: 'multiple_choice',
    // REVIEW: Lionel Messi has 8 Ballons d’Or as of 2024 (most recent 2023).
    text: 'Who has won the most Ballon d’Or awards in men’s soccer (8)?',
    options: ['Cristiano Ronaldo', 'Lionel Messi', 'Zinedine Zidane', 'Ronaldinho'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.45,
    sport: 'Soccer',
  },
  {
    id: 'soccer-hard-3',
    type: 'multiple_choice',
    text: 'Which player scored the famous "Hand of God" goal in the 1986 World Cup?',
    options: ['Pelé', 'Diego Maradona', 'Zico', 'Romario'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.50,
    sport: 'Soccer',
  },
  {
    id: 'soccer-hard-4',
    type: 'multiple_choice',
    text: 'Which year did the FIFA World Cup take place in South Africa?',
    options: ['2002', '2006', '2010', '2014'],
    correctIndex: 2,
    difficulty: 'hard',
    intrinsic: 0.40,
    sport: 'Soccer',
  },

  // =============================================================
  // General
  // =============================================================

  // ----- general easy -----
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
  {
    id: 'gen-easy-3',
    type: 'multiple_choice',
    text: 'In which sport is the term "slam dunk" most commonly used?',
    options: ['Volleyball', 'Basketball', 'Football', 'Tennis'],
    correctIndex: 1,
    difficulty: 'easy',
    intrinsic: 0.92,
    sport: 'general',
  },
  {
    id: 'gen-easy-4',
    type: 'multiple_choice',
    text: 'How many holes are played in a standard round of professional golf?',
    options: ['9', '12', '18', '24'],
    correctIndex: 2,
    difficulty: 'easy',
    intrinsic: 0.85,
    sport: 'general',
  },

  // ----- general medium -----
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
  {
    id: 'gen-med-3',
    type: 'multiple_choice',
    text: 'In which sport is the Stanley Cup the championship trophy?',
    options: ['Football', 'Hockey', 'Basketball', 'Cricket'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.74,
    sport: 'general',
  },
  {
    id: 'gen-med-4',
    type: 'multiple_choice',
    text: 'Which tennis Grand Slam is played on clay courts?',
    options: ['Australian Open', 'French Open', 'Wimbledon', 'US Open'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.55,
    sport: 'general',
  },
  {
    id: 'gen-med-5',
    type: 'multiple_choice',
    text: 'Which sport is associated with the term "knockout" or "KO"?',
    options: ['Cycling', 'Boxing', 'Swimming', 'Archery'],
    correctIndex: 1,
    difficulty: 'medium',
    intrinsic: 0.80,
    sport: 'general',
  },

  // ----- general hard -----
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
  {
    id: 'gen-hard-2',
    type: 'multiple_choice',
    // REVIEW: Wimbledon is the oldest of the four tennis Grand Slams (first
    // held 1877).
    text: 'Which of the four tennis Grand Slams is the oldest?',
    options: ['Wimbledon', 'US Open', 'French Open', 'Australian Open'],
    correctIndex: 0,
    difficulty: 'hard',
    intrinsic: 0.42,
    sport: 'general',
  },
  {
    id: 'gen-hard-3',
    type: 'multiple_choice',
    // REVIEW: Phelps holds the all-time Olympic gold medal record at 23.
    text: 'Who holds the all-time record for most Olympic gold medals won by a single athlete?',
    options: ['Usain Bolt', 'Michael Phelps', 'Carl Lewis', 'Larisa Latynina'],
    correctIndex: 1,
    difficulty: 'hard',
    intrinsic: 0.40,
    sport: 'general',
  },
];
