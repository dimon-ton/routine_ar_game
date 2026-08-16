import { describe, expect, it } from 'vitest';
import { accuracy, createInitialState, gameReducer } from '../../src/features/game/gameReducer';
import { QUESTIONS_PER_ROUND } from '../../src/data/routines';
import type { GameState } from '../../src/types/game';

describe('gameReducer', () => {
  it('calculates score, first-attempt accuracy, and question completion', () => {
    let state = gameReducer(createInitialState(), { type: 'START', calibration: false, now: 100 });
    state = gameReducer(state, { type: 'BEGIN_ROUND' });
    state = gameReducer(state, { type: 'CORRECT', id: '1-wake-up', now: 200 });
    expect(state.score).toBe(1);
    expect(state.firstAttemptCorrect).toBe(1);
    expect(state.questionIndex).toBe(1);
    expect(accuracy(state)).toBe(4);
  });
  it('counts retries and does not count a retried answer as first-attempt correct', () => {
    let state = gameReducer(
      gameReducer(createInitialState(), { type: 'START', calibration: false, now: 0 }),
      { type: 'BEGIN_ROUND' },
    );
    state = gameReducer(state, { type: 'WRONG' });
    state = gameReducer(state, { type: 'CORRECT', id: '1-wake-up', now: 1 });
    expect(state.retries).toBe(1);
    expect(state.firstAttemptCorrect).toBe(0);
    expect(state.roundResults[1].retries).toBe(1);
  });
  it('prevents duplicate scoring', () => {
    let state: GameState = { ...createInitialState(), screen: 'playing' };
    state = gameReducer(state, { type: 'CORRECT', id: '1-wake-up', now: 1 });
    const duplicate = gameReducer(state, { type: 'CORRECT', id: '1-wake-up', now: 2 });
    expect(duplicate).toBe(state);
    expect(duplicate.score).toBe(1);
  });
  it('progresses through rounds after all eight vocabulary questions', () => {
    let state: GameState = { ...createInitialState(), screen: 'playing' };
    for (let i = 0; i < QUESTIONS_PER_ROUND; i += 1)
      state = gameReducer(state, { type: 'CORRECT', id: `1-${i}`, now: i });
    expect(state.round).toBe(2);
    expect(state.screen).toBe('roundIntro');
    expect(state.questionIndex).toBe(0);
  });
  it('finishes after round three', () => {
    let state: GameState = {
      ...createInitialState(),
      screen: 'playing' as const,
      round: 3 as const,
      questionIndex: QUESTIONS_PER_ROUND - 1,
      startedAt: 1,
    };
    state = gameReducer(state, { type: 'CORRECT', id: '3-last', now: 5000 });
    expect(state.screen).toBe('results');
    expect(state.finishedAt).toBe(5000);
  });
  it('resets the full game', () => {
    const changed = { ...createInitialState(), score: 12, retries: 4, questionIndex: 3 };
    const reset = gameReducer(changed, { type: 'RESET' });
    expect(reset.score).toBe(0);
    expect(reset.retries).toBe(0);
    expect(reset.round).toBe(1);
    expect(reset.screen).toBe('roundIntro');
  });
  it('restarts a round and removes only its earned stats', () => {
    let state: GameState = { ...createInitialState(), screen: 'playing', score: 1 };
    state = {
      ...state,
      roundResults: {
        ...state.roundResults,
        1: { correct: 1, firstAttemptCorrect: 1, retries: 2 },
      },
      firstAttemptCorrect: 1,
      retries: 2,
      answeredIds: ['1-a'],
    };
    state = gameReducer(state, { type: 'RESTART_ROUND' });
    expect(state.score).toBe(0);
    expect(state.retries).toBe(0);
    expect(state.questionIndex).toBe(0);
    expect(state.answeredIds).toEqual([]);
  });
});
