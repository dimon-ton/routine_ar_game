import type { Choice, GameQuestion, RoundNumber } from '../types/game';

const titles = { 1: 'Catch the Picture', 2: 'Catch the Time', 3: 'Choose the Correct Sentence' };
interface Props {
  round: RoundNumber;
  index: number;
  score: number;
  question: GameQuestion;
  feedback: 'correct' | 'wrong' | null;
  selectedId: string;
  onAnswer: (choice: Choice) => void;
  handMissing: boolean;
}

export function GameScreen({
  round,
  index,
  score,
  question,
  feedback,
  selectedId,
  onAnswer,
  handMissing,
}: Props) {
  const { routine, choices } = question;
  return (
    <main className={`game screen round-${round}`}>
      <header className="game-header">
        <div>
          <span className="round-badge">Round {round}</span>
          <strong>{titles[round]}</strong>
        </div>
        <div className="progress-wrap" aria-label={`Question ${index + 1} of 6`}>
          <span>Question {index + 1}/6</span>
          <div className="progress-track">
            <i style={{ width: `${((index + 1) / 6) * 100}%` }} />
          </div>
        </div>
        <div className="score-badge">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
      </header>
      <section className="question-area">
        {round === 1 ? (
          <>
            <p className="question-kicker">Which picture matches?</p>
            <h1>{routine.phrase}</h1>
          </>
        ) : round === 2 ? (
          <div className="clock-prompt">
            <img src={routine.clockIllustration} alt={`Clock showing ${routine.spokenTime}`} />
            <div>
              <p className="question-kicker">Look at the clock</p>
              <h1>What time is it?</h1>
            </div>
          </div>
        ) : (
          <>
            <div className="routine-prompt">
              <img src={routine.illustration} alt={`${routine.phrase} illustration`} />
              <div>
                <span className="time-chip">{routine.digitalTime}</span>
                <p className="question-kicker">Say it in English</p>
                <h1>{routine.question}</h1>
              </div>
            </div>
          </>
        )}
      </section>
      <section className={`choices choices-${round}`} aria-label="Answer choices">
        {choices.map((choice, choiceIndex) => (
          <button
            key={choice.id}
            data-choice-id={choice.id}
            className={`choice-card ${selectedId === choice.id ? (feedback ?? '') : ''}`}
            onClick={() => onAnswer(choice)}
            disabled={feedback === 'correct'}
            aria-label={`Choice ${String.fromCharCode(65 + choiceIndex)}: ${choice.label}`}
          >
            {round === 1 && <img src={choice.illustration} alt={`${choice.label} illustration`} />}
            <span className="choice-content">
              {round === 3 && <b>{String.fromCharCode(65 + choiceIndex)}</b>}
              <strong>{round === 1 ? '' : choice.label}</strong>
            </span>
            {round === 1 && <span className="picture-label">Choose picture</span>}
          </button>
        ))}
      </section>
      <div className={`feedback ${feedback ?? ''}`} role="status" aria-live="polite">
        {feedback === 'correct' ? (
          <>
            <strong>Correct! +1 point</strong>
            {round > 1 && <span>{routine.answer}</span>}
            <div className="confetti" aria-hidden="true">
              ★ ✦ ★
            </div>
          </>
        ) : feedback === 'wrong' ? (
          <strong>Try again! You can do it.</strong>
        ) : handMissing ? (
          <span>Hand not detected — raise your hand or use Mouse / Touch.</span>
        ) : (
          <span>
            {round === 1 ? 'Point, then pinch or hold to choose' : 'Choose the best answer'}
          </span>
        )}
      </div>
    </main>
  );
}
