import type { GameState, RoundNumber } from '../../types/game';
import { QUESTIONS_PER_ROUND, TOTAL_QUESTIONS } from '../../data/routines';

const emptyRound = () => ({ correct: 0, firstAttemptCorrect: 0, retries: 0 });

export function createInitialState(): GameState {
  return {
    screen: 'welcome',
    round: 1,
    questionIndex: 0,
    score: 0,
    firstAttemptCorrect: 0,
    retries: 0,
    attemptsOnQuestion: 0,
    roundResults: { 1: emptyRound(), 2: emptyRound(), 3: emptyRound() },
    startedAt: null,
    finishedAt: null,
    answeredIds: [],
  };
}

export type GameAction =
  | { type: 'START'; calibration: boolean; now: number }
  | { type: 'CALIBRATED' }
  | { type: 'BEGIN_ROUND' }
  | { type: 'WRONG' }
  | { type: 'CORRECT'; id: string; now: number }
  | { type: 'SKIP'; now: number }
  | { type: 'RESTART_QUESTION' }
  | { type: 'RESTART_ROUND' }
  | { type: 'SHOW_REVIEW' }
  | { type: 'SHOW_RESULTS' }
  | { type: 'HOME' }
  | { type: 'RESET' };

function advance(state: GameState, now: number): GameState {
  if (state.questionIndex < QUESTIONS_PER_ROUND - 1)
    return { ...state, questionIndex: state.questionIndex + 1, attemptsOnQuestion: 0 };
  if (state.round < 3)
    return {
      ...state,
      screen: 'roundIntro',
      round: (state.round + 1) as RoundNumber,
      questionIndex: 0,
      attemptsOnQuestion: 0,
    };
  return { ...state, screen: 'results', finishedAt: now, attemptsOnQuestion: 0 };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...createInitialState(),
        screen: action.calibration ? 'calibration' : 'roundIntro',
        startedAt: action.now,
      };
    case 'CALIBRATED':
      return { ...state, screen: 'roundIntro' };
    case 'BEGIN_ROUND':
      return { ...state, screen: 'playing' };
    case 'WRONG':
      return {
        ...state,
        attemptsOnQuestion: state.attemptsOnQuestion + 1,
        retries: state.retries + 1,
        roundResults: {
          ...state.roundResults,
          [state.round]: {
            ...state.roundResults[state.round],
            retries: state.roundResults[state.round].retries + 1,
          },
        },
      };
    case 'CORRECT': {
      if (state.answeredIds.includes(action.id)) return state;
      const first = state.attemptsOnQuestion === 0;
      const updated = {
        ...state,
        score: state.score + 1,
        firstAttemptCorrect: state.firstAttemptCorrect + (first ? 1 : 0),
        answeredIds: [...state.answeredIds, action.id],
        roundResults: {
          ...state.roundResults,
          [state.round]: {
            ...state.roundResults[state.round],
            correct: state.roundResults[state.round].correct + 1,
            firstAttemptCorrect:
              state.roundResults[state.round].firstAttemptCorrect + (first ? 1 : 0),
          },
        },
      };
      return advance(updated, action.now);
    }
    case 'SKIP':
      return advance(state, action.now);
    case 'RESTART_QUESTION':
      return { ...state, attemptsOnQuestion: 0 };
    case 'RESTART_ROUND':
      return {
        ...state,
        questionIndex: 0,
        attemptsOnQuestion: 0,
        score: state.score - state.roundResults[state.round].correct,
        firstAttemptCorrect:
          state.firstAttemptCorrect - state.roundResults[state.round].firstAttemptCorrect,
        retries: state.retries - state.roundResults[state.round].retries,
        answeredIds: state.answeredIds.filter((id) => !id.startsWith(`${state.round}-`)),
        roundResults: { ...state.roundResults, [state.round]: emptyRound() },
      };
    case 'SHOW_REVIEW':
      return { ...state, screen: 'review' };
    case 'SHOW_RESULTS':
      return { ...state, screen: 'results' };
    case 'HOME':
      return createInitialState();
    case 'RESET':
      return { ...createInitialState(), screen: 'roundIntro', startedAt: Date.now() };
  }
}

export const accuracy = (state: Pick<GameState, 'firstAttemptCorrect'>) =>
  Math.round((state.firstAttemptCorrect / TOTAL_QUESTIONS) * 100);
export const elapsedSeconds = (
  state: Pick<GameState, 'startedAt' | 'finishedAt'>,
  now = Date.now(),
) =>
  state.startedAt
    ? Math.max(0, Math.round(((state.finishedAt ?? now) - state.startedAt) / 1000))
    : 0;
