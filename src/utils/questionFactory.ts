import { ROUTINES, ROUTINE_BY_ID } from '../data/routines';
import type { Choice, GameQuestion, RoundNumber, RoutineItem } from '../types/game';

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function spokenSentence(item: RoutineItem, spokenTime: string): string {
  return item.answer.replace(item.spokenTime, spokenTime);
}

function timeDistractors(item: RoutineItem): RoutineItem[] {
  const preferred = item.distractorIds.map((id) => ROUTINE_BY_ID[id]).filter(Boolean);
  const uniqueTimes = ROUTINES.filter(
    (candidate) => candidate.id !== item.id && candidate.digitalTime !== item.digitalTime,
  );
  return [...preferred, ...uniqueTimes]
    .filter(
      (candidate, index, all) =>
        all.findIndex((x) => x.digitalTime === candidate.digitalTime) === index,
    )
    .slice(0, 2);
}

export function makeChoices(
  item: RoutineItem,
  round: RoundNumber,
  random: () => number = Math.random,
): Choice[] {
  let choices: Choice[];
  if (round === 1) {
    choices = [item, ...item.distractorIds.map((id) => ROUTINE_BY_ID[id])].map((routine) => ({
      id: routine.id,
      label: routine.phrase,
      illustration: routine.illustration,
      correct: routine.id === item.id,
    }));
  } else if (round === 2) {
    choices = [item, ...timeDistractors(item)].map((routine) => ({
      id: routine.id,
      label: routine.spokenTime,
      correct: routine.id === item.id,
    }));
  } else {
    choices = [item, ...timeDistractors(item)].map((routine) => ({
      id: routine.id,
      label: spokenSentence(item, routine.spokenTime),
      correct: routine.id === item.id,
    }));
  }
  return shuffle(choices, random);
}

export function createRoundQuestions(
  round: RoundNumber,
  random: () => number = Math.random,
): GameQuestion[] {
  let lastCorrectIndex = -1;
  return ROUTINES.map((routine) => {
    const choices = makeChoices(routine, round, random);
    let correctIndex = choices.findIndex((choice) => choice.correct);
    if (correctIndex === lastCorrectIndex) {
      const swapIndex = (correctIndex + 1) % choices.length;
      [choices[correctIndex], choices[swapIndex]] = [choices[swapIndex], choices[correctIndex]];
      correctIndex = swapIndex;
    }
    lastCorrectIndex = correctIndex;
    return { routine, choices };
  });
}
