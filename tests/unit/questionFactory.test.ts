import { describe, expect, it } from 'vitest';
import { ROUTINES } from '../../src/data/routines';
import {
  createRoundQuestions,
  makeChoices,
  shuffle,
  spokenSentence,
} from '../../src/utils/questionFactory';

describe('questionFactory', () => {
  it('starts every vocabulary phrase with a lowercase letter', () => {
    expect(ROUTINES.every((routine) => /^[a-z]/.test(routine.phrase))).toBe(true);
  });
  it('shuffles without losing values', () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });
  it('provides one correct answer and no duplicate positions or labels', () => {
    for (const round of [1, 2, 3] as const)
      for (const routine of ROUTINES) {
        const choices = makeChoices(routine, round, () => 0.4);
        expect(choices).toHaveLength(3);
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(new Set(choices.map((c) => c.label)).size).toBe(3);
      }
  });
  it('does not repeat the correct answer position consecutively', () => {
    for (const round of [1, 2, 3] as const) {
      const positions = createRoundQuestions(round, () => 0.2).map((q) =>
        q.choices.findIndex((c) => c.correct),
      );
      positions.slice(1).forEach((position, i) => expect(position).not.toBe(positions[i]));
    }
  });
  it('generates grammatical sentence distractors by changing only time', () => {
    const item = ROUTINES[2];
    const choices = makeChoices(item, 3, () => 0.6);
    expect(choices.every((choice) => choice.label.startsWith('I go to school at '))).toBe(true);
    expect(new Set(choices.map((choice) => choice.label)).size).toBe(3);
  });
  it('maps spoken times into model sentences', () => {
    expect(spokenSentence(ROUTINES[0], "nine o'clock")).toBe("I wake up at nine o'clock.");
  });
  it('uses spoken exact hours for every Round 2 time choice', () => {
    for (const routine of ROUTINES) {
      const choices = makeChoices(routine, 2, () => 0.5);
      expect(choices.every((choice) => /^[a-z]+ o'clock$/.test(choice.label))).toBe(true);
    }
  });
});
