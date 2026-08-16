import type { Dispatch, SetStateAction } from 'react';
import type { Preferences } from '../types/game';

interface Props {
  preferences: Preferences;
  setPreferences: Dispatch<SetStateAction<Preferences>>;
  onStart: () => void;
  onHow: () => void;
  onFullscreen: () => void;
}

export function WelcomeScreen({
  preferences,
  setPreferences,
  onStart,
  onHow,
  onFullscreen,
}: Props) {
  const set = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));
  return (
    <main className="welcome screen">
      <div className="welcome-art" aria-hidden="true">
        <span>ABC</span>
        <span>6:00</span>
        <span>★</span>
      </div>
      <section className="welcome-card">
        <div className="logo-mark">DR</div>
        <p className="eyebrow">Learn English with movement</p>
        <h1>
          Daily Routine
          <br />
          <em>AR Challenge</em>
        </h1>
        <p className="subtitle">Move your hand, choose the answer, and earn points!</p>
        <div className="mode-picker" aria-label="Input mode">
          <button
            className={preferences.inputMode === 'hand' ? 'selected' : ''}
            onClick={() => set('inputMode', 'hand')}
          >
            <strong>Hand Tracking</strong>
            <small>Use your webcam</small>
          </button>
          <button
            className={preferences.inputMode === 'mouse' ? 'selected' : ''}
            onClick={() => set('inputMode', 'mouse')}
          >
            <strong>Mouse / Touch</strong>
            <small>No camera needed</small>
          </button>
        </div>
        <button className="primary start-button" onClick={onStart}>
          Start Game <span aria-hidden="true">→</span>
        </button>
        <div className="welcome-actions">
          <button onClick={onHow}>How to Play</button>
          <button
            onClick={() => set('sound', !preferences.sound)}
            aria-label={preferences.sound ? 'Mute sound' : 'Turn sound on'}
          >
            {preferences.sound ? 'Sound on' : 'Sound off'}
          </button>
          <button onClick={onFullscreen}>Fullscreen</button>
        </div>
        <p className="privacy-note">
          Your webcam is processed locally in this browser. Camera images are never uploaded or
          saved.
        </p>
      </section>
    </main>
  );
}
