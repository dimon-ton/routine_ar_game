import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CalibrationScreen } from './components/CalibrationScreen';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { RoundIntro } from './components/RoundIntro';
import { TeacherSettings } from './components/TeacherSettings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { gameReducer, createInitialState, elapsedSeconds } from './features/game/gameReducer';
import { HandCursorOverlay } from './features/handTracking/HandCursorOverlay';
import { useHandTracking } from './features/handTracking/useHandTracking';
import { useFeedback } from './hooks/useFeedback';
import { useBackgroundAmbience } from './hooks/useBackgroundAmbience';
import { usePreferences } from './hooks/usePreferences';
import type { Choice } from './types/game';
import { createRoundQuestions } from './utils/questionFactory';

const testMode = new URLSearchParams(location.search).has('test');

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [preferences, setPreferences] = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [calibrated, setCalibrated] = useState(false);
  const [cameraRetry, setCameraRetry] = useState(0);
  const answerLocked = useRef(false);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraActive =
    preferences.inputMode === 'hand' &&
    ['calibration', 'roundIntro', 'playing'].includes(state.screen);
  const tracking = useHandTracking(cameraActive, videoRef, preferences.sensitivity, cameraRetry);
  const { tone, speak, primeFeedback } = useFeedback(preferences.sound, preferences.speech);
  const questions = useMemo(() => createRoundQuestions(state.round), [state.round]);
  const question = questions[state.questionIndex];
  const { primeAmbience, startAmbience } = useBackgroundAmbience(
    question?.routine.ambience,
    preferences.sound,
    state.screen === 'playing',
    feedback !== null,
  );

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }, []);
  const start = () => {
    primeAmbience();
    primeFeedback();
    setFeedback(null);
    dispatch({ type: 'START', calibration: preferences.inputMode === 'hand', now: Date.now() });
  };
  const clearQuestionUi = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    answerLocked.current = false;
    setFeedback(null);
    setSelectedId('');
  }, []);
  const answer = useCallback(
    (choice: Choice) => {
      if (state.screen !== 'playing' || answerLocked.current) return;
      setSelectedId(choice.id);
      if (!choice.correct) {
        setFeedback('wrong');
        tone(false);
        dispatch({ type: 'WRONG' });
        window.setTimeout(
          () => {
            setFeedback(null);
            setSelectedId('');
          },
          testMode ? 180 : 650,
        );
        return;
      }
      answerLocked.current = true;
      setFeedback('correct');
      tone(true);
      speak(state.round === 1 ? question.routine.phrase : question.routine.answer);
      timerRef.current = window.setTimeout(
        () => {
          dispatch({
            type: 'CORRECT',
            id: `${state.round}-${question.routine.id}`,
            now: Date.now(),
          });
          answerLocked.current = false;
          setFeedback(null);
          setSelectedId('');
        },
        testMode ? 180 : state.round === 1 ? 1200 : 1800,
      );
    },
    [question, speak, state.round, state.screen, tone],
  );

  const handSelect = useCallback(
    (id: string) => {
      if (state.screen === 'calibration' && id === 'calibration-target') {
        setCalibrated(true);
        tone(true);
        return;
      }
      const choice = question?.choices.find((candidate) => candidate.id === id);
      if (choice) answer(choice);
    },
    [answer, question, state.screen, tone],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'f') fullscreen();
      if (event.key.toLowerCase() === 'm') setPreferences((p) => ({ ...p, sound: !p.sound }));
      if (event.key.toLowerCase() === 'r' && state.screen === 'playing') {
        clearQuestionUi();
        dispatch({ type: 'RESTART_QUESTION' });
      }
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [clearQuestionUi, fullscreen, setPreferences, state.screen]);
  useEffect(() => {
    if (state.screen === 'results') {
      localStorage.setItem(
        'daily-routine-latest-score',
        JSON.stringify({
          score: state.score,
          accuracy: Math.round((state.firstAttemptCorrect / 18) * 100),
          retries: state.retries,
          seconds: elapsedSeconds(state),
          completedAt: new Date().toISOString(),
        }),
      );
    }
  }, [state]);

  const restartQuestion = () => {
    clearQuestionUi();
    dispatch({ type: 'RESTART_QUESTION' });
  };
  const skip = () => {
    clearQuestionUi();
    dispatch({ type: 'SKIP', now: Date.now() });
    setSettingsOpen(false);
  };
  const restartRound = () => {
    clearQuestionUi();
    dispatch({ type: 'RESTART_ROUND' });
    setSettingsOpen(false);
  };
  const playAgain = () => {
    clearQuestionUi();
    dispatch({ type: 'RESET' });
  };
  const retryCamera = () => {
    setCalibrated(false);
    setCameraRetry((value) => value + 1);
  };

  return (
    <div className="app-shell">
      <div
        className={`camera-layer ${cameraActive ? 'active' : ''}`}
        style={{ opacity: preferences.cameraOpacity }}
      >
        <video ref={videoRef} muted playsInline aria-label="Mirrored camera preview" />
      </div>
      <div className={`camera-tint ${cameraActive ? 'active' : ''}`} />
      {state.screen === 'welcome' && (
        <WelcomeScreen
          preferences={preferences}
          setPreferences={setPreferences}
          onStart={start}
          onHow={() => setHowOpen(true)}
          onFullscreen={fullscreen}
        />
      )}
      {state.screen === 'calibration' && (
        <CalibrationScreen
          status={tracking.status}
          error={tracking.error}
          calibrated={calibrated}
          onCalibrate={() => setCalibrated(true)}
          onContinue={() => dispatch({ type: 'CALIBRATED' })}
          onRetry={retryCamera}
          onFallback={() => {
            setPreferences((p) => ({ ...p, inputMode: 'mouse' }));
            dispatch({ type: 'CALIBRATED' });
          }}
        />
      )}
      {state.screen === 'roundIntro' && (
        <RoundIntro
          round={state.round}
          onContinue={() => {
            startAmbience();
            dispatch({ type: 'BEGIN_ROUND' });
          }}
        />
      )}
      {state.screen === 'playing' && (
        <GameScreen
          round={state.round}
          index={state.questionIndex}
          score={state.score}
          question={question}
          feedback={feedback}
          selectedId={selectedId}
          onAnswer={answer}
          handMissing={preferences.inputMode === 'hand' && tracking.status === 'ready'}
        />
      )}
      {(state.screen === 'results' || state.screen === 'review') && (
        <ResultsScreen
          state={state}
          review={state.screen === 'review'}
          onReview={() => dispatch({ type: 'SHOW_REVIEW' })}
          onResults={() => dispatch({ type: 'SHOW_RESULTS' })}
          onAgain={playAgain}
          onHome={() => dispatch({ type: 'HOME' })}
        />
      )}
      {state.screen !== 'welcome' && state.screen !== 'results' && state.screen !== 'review' && (
        <button
          className="settings-trigger"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open teacher settings"
        >
          Teacher Settings
        </button>
      )}
      <TeacherSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        setPreferences={setPreferences}
        onRestartQuestion={restartQuestion}
        onSkip={skip}
        onRestartRound={restartRound}
        onFullscreen={fullscreen}
        inGame={state.screen === 'playing'}
      />
      {howOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setHowOpen(false)}>
          <section
            className="how-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button className="icon-button" onClick={() => setHowOpen(false)} aria-label="Close">
              ×
            </button>
            <p className="eyebrow">Three quick rounds</p>
            <h2 id="how-title">How to Play</h2>
            <ol>
              <li>
                <b>Point</b> with your index finger.
              </li>
              <li>
                <b>Pinch</b> to choose, or hold over an answer in Dwell mode.
              </li>
              <li>Learn pictures, times, then complete sentences!</li>
            </ol>
            <p>Mouse, touch, Tab, and Enter also work.</p>
            <button className="primary" onClick={() => setHowOpen(false)}>
              Got it!
            </button>
          </section>
        </div>
      )}
      <HandCursorOverlay
        active={cameraActive}
        pointerRef={tracking.pointerRef}
        landmarksRef={tracking.landmarksRef}
        pinchRef={tracking.pinchRef}
        gesture={preferences.gestureMode}
        dwellDuration={preferences.dwellDuration}
        onSelect={handSelect}
      />
    </div>
  );
}
