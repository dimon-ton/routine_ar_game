export type InputMode = 'hand' | 'mouse';
export type GestureMode = 'pinch' | 'dwell';
export type RoundNumber = 1 | 2 | 3;
export type Screen = 'welcome' | 'calibration' | 'roundIntro' | 'playing' | 'results' | 'review';

export interface RoutineItem {
  id: string;
  phrase: string;
  question: string;
  answer: string;
  digitalTime: string;
  spokenTime: string;
  illustration: string;
  clockIllustration: string;
  ambience: string;
  distractorIds: string[];
}

export interface Choice {
  id: string;
  label: string;
  illustration?: string;
  correct: boolean;
}

export interface GameQuestion {
  routine: RoutineItem;
  choices: Choice[];
}

export interface RoundResult {
  correct: number;
  firstAttemptCorrect: number;
  retries: number;
}

export interface GameState {
  screen: Screen;
  round: RoundNumber;
  questionIndex: number;
  score: number;
  firstAttemptCorrect: number;
  retries: number;
  attemptsOnQuestion: number;
  roundResults: Record<RoundNumber, RoundResult>;
  startedAt: number | null;
  finishedAt: number | null;
  answeredIds: string[];
}

export interface Preferences {
  inputMode: InputMode;
  gestureMode: GestureMode;
  sound: boolean;
  speech: boolean;
  cameraOpacity: number;
  sensitivity: number;
  dwellDuration: number;
}
