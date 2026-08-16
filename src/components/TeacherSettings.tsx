import type { Dispatch, SetStateAction } from 'react';
import type { Preferences } from '../types/game';

interface Props {
  open: boolean;
  onClose: () => void;
  preferences: Preferences;
  setPreferences: Dispatch<SetStateAction<Preferences>>;
  onRestartQuestion: () => void;
  onSkip: () => void;
  onRestartRound: () => void;
  onFullscreen: () => void;
  inGame: boolean;
}

export function TeacherSettings({
  open,
  onClose,
  preferences,
  setPreferences,
  onRestartQuestion,
  onSkip,
  onRestartRound,
  onFullscreen,
  inGame,
}: Props) {
  if (!open) return null;
  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Teacher controls</p>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>
        <label className="setting-row">
          <span>Hand input</span>
          <input
            type="checkbox"
            checked={preferences.inputMode === 'hand'}
            onChange={(event) => update('inputMode', event.target.checked ? 'hand' : 'mouse')}
          />
        </label>
        <label className="setting-row">
          <span>Sound &amp; ambience</span>
          <input
            type="checkbox"
            checked={preferences.sound}
            onChange={(event) => update('sound', event.target.checked)}
          />
        </label>
        <label className="setting-row">
          <span>English speech</span>
          <input
            type="checkbox"
            checked={preferences.speech}
            onChange={(event) => update('speech', event.target.checked)}
          />
        </label>
        <label className="setting-row">
          <span>Background sound</span>
          <input
            type="checkbox"
            checked={preferences.backgroundSound}
            onChange={(event) => update('backgroundSound', event.target.checked)}
          />
        </label>
        <label>
          Background volume <output>{Math.round(preferences.backgroundVolume * 100)}%</output>
          <input
            type="range"
            aria-label="Background volume"
            min="0"
            max="0.2"
            step="0.01"
            value={preferences.backgroundVolume}
            disabled={!preferences.sound || !preferences.backgroundSound}
            onInput={(event) => update('backgroundVolume', Number(event.currentTarget.value))}
          />
        </label>
        <label>
          Camera visibility <output>{Math.round(preferences.cameraOpacity * 100)}%</output>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={preferences.cameraOpacity}
            onChange={(event) => update('cameraOpacity', Number(event.target.value))}
          />
        </label>
        <label>
          Cursor sensitivity <output>{preferences.sensitivity.toFixed(1)}×</output>
          <input
            type="range"
            min="0.7"
            max="1.7"
            step="0.1"
            value={preferences.sensitivity}
            onChange={(event) => update('sensitivity', Number(event.target.value))}
          />
        </label>
        <div className="settings-actions">
          <button onClick={onFullscreen}>Toggle fullscreen</button>
          {inGame && (
            <>
              <button onClick={onRestartQuestion}>Restart question</button>
              <button onClick={onSkip}>Skip question</button>
              <button onClick={onRestartRound}>Restart round</button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
