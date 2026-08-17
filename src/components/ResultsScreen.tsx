import { QUESTIONS_PER_ROUND, ROUTINES, TOTAL_QUESTIONS } from '../data/routines';
import { accuracy, elapsedSeconds } from '../features/game/gameReducer';
import type { GameState } from '../types/game';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
export function ResultsScreen({
  state,
  review,
  onReview,
  onResults,
  onAgain,
  onHome,
}: {
  state: GameState;
  review: boolean;
  onReview: () => void;
  onResults: () => void;
  onAgain: () => void;
  onHome: () => void;
}) {
  if (review)
    return (
      <main className="results screen">
        <section className="results-card review-card">
          <p className="eyebrow">Answer review</p>
          <h1>Daily Routine Answers</h1>
          <div className="review-grid">
            {ROUTINES.map((item) => (
              <article key={item.id}>
                <img src={item.illustration} alt="" />
                <div>
                  <strong>
                    {item.phrase} · {item.digitalTime}
                  </strong>
                  <p>{item.answer}</p>
                </div>
              </article>
            ))}
          </div>
          <button className="primary" onClick={onResults}>
            Back to Results
          </button>
        </section>
      </main>
    );
  const pct = accuracy(state);
  const time = elapsedSeconds(state);
  const message =
    state.score >= Math.ceil(TOTAL_QUESTIONS * 0.89)
      ? 'Excellent! You are a Daily Routine Star!'
      : state.score >= Math.ceil(TOTAL_QUESTIONS * 0.67)
        ? 'Great work! Keep practicing!'
        : state.score >= Math.ceil(TOTAL_QUESTIONS * 0.45)
          ? 'Good effort! Let’s try one more time!'
          : 'Keep going! Practice makes progress!';
  return (
    <main className="results screen">
      <section className="results-card">
        <div className="trophy" aria-hidden="true">
          ★
        </div>
        <p className="eyebrow">Challenge complete</p>
        <h1>Great Job!</h1>
        <p className="motivation">{message}</p>
        <div className="score-ring">
          <strong>{state.score}</strong>
          <span>out of {TOTAL_QUESTIONS}</span>
        </div>
        <div className="stat-grid">
          <div>
            <strong>{pct}%</strong>
            <span>First-attempt accuracy</span>
          </div>
          <div>
            <strong>{state.retries}</strong>
            <span>Retries</span>
          </div>
          <div>
            <strong>{formatTime(time)}</strong>
            <span>Play time</span>
          </div>
        </div>
        <div className="round-results">
          {([1, 2, 3] as const).map((round) => (
            <div key={round}>
              <span>Round {round}</span>
              <strong>{state.roundResults[round].correct}/{QUESTIONS_PER_ROUND}</strong>
            </div>
          ))}
        </div>
        <div className="result-actions">
          <button className="primary" onClick={onAgain}>
            Play Again
          </button>
          <button onClick={onReview}>Review Answers</button>
          <button onClick={onHome}>Return to Home</button>
        </div>
      </section>
    </main>
  );
}
