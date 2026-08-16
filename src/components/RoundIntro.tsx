import type { RoundNumber } from '../types/game';

const info = {
  1: {
    title: 'Catch the Picture',
    instruction: 'Point to the matching picture, then pinch your thumb and index finger.',
    focus: 'Vocabulary',
  },
  2: {
    title: 'Catch the Time',
    instruction: 'Look at the routine and choose the correct time.',
    focus: 'Comprehension',
  },
  3: {
    title: 'Choose the Correct Sentence',
    instruction: 'Look at the picture and time. Choose the correct sentence.',
    focus: 'Sentence Structure',
  },
} as const;

export function RoundIntro({ round, onContinue }: { round: RoundNumber; onContinue: () => void }) {
  const item = info[round];
  return (
    <main className={`round-intro screen round-${round}`}>
      <section className="intro-card">
        <div className="round-orbit">
          <span>{round}</span>
        </div>
        <p className="eyebrow">Round {round} of 3</p>
        <h1>{item.title}</h1>
        <p className="intro-instruction">{item.instruction}</p>
        <div className="focus-pill">
          <span>Learning focus</span>
          <strong>{item.focus}</strong>
        </div>
        <button className="primary pulse" onClick={onContinue}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  );
}
