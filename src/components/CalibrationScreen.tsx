import type { TrackingStatus } from '../features/handTracking/useHandTracking';

export function CalibrationScreen({
  status,
  error,
  calibrated,
  onCalibrate,
  onContinue,
  onRetry,
  onFallback,
}: {
  status: TrackingStatus;
  error: string;
  calibrated: boolean;
  onCalibrate: () => void;
  onContinue: () => void;
  onRetry: () => void;
  onFallback: () => void;
}) {
  const detected = status === 'detected';
  return (
    <main className="calibration screen">
      <section className="calibration-card">
        <p className="eyebrow">Camera setup</p>
        <h1>
          {status === 'requesting'
            ? 'Allow camera access'
            : status === 'loading'
              ? 'Getting hand tracking ready…'
              : status === 'error'
                ? 'Let’s use another way'
                : detected
                  ? 'Hand detected!'
                  : 'Raise one hand'}
        </h1>
        {status === 'error' ? (
          <>
            <p className="error-message">{error}</p>
            <div className="calibration-actions">
              <button onClick={onRetry}>Retry Camera</button>
              <button className="primary" onClick={onFallback}>
                Use Mouse / Touch
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              {status === 'requesting'
                ? 'Choose Allow in your browser. Your video stays on this device.'
                : status === 'loading'
                  ? 'Loading the MediaPipe hand model. This may take a moment the first time.'
                  : detected
                    ? 'Great! Move the pointer onto the glowing target and pinch (or hold).'
                    : 'Face your palm toward the camera in a well-lit space.'}
            </p>
            <button
              data-choice-id="calibration-target"
              className={`calibration-target ${calibrated ? 'complete' : ''}`}
              onClick={onCalibrate}
              aria-label="Calibration target"
            >
              <span>{calibrated ? '✓' : '◎'}</span>
              <small>{calibrated ? 'Ready!' : 'Move here'}</small>
            </button>
            <div className="calibration-status">
              <span className={detected ? 'status-dot detected' : 'status-dot'}></span>
              {detected ? 'Tracking your hand' : 'Looking for a hand…'}
            </div>
            <div className="calibration-actions">
              <button onClick={onRetry}>Retry</button>
              <button className="primary" disabled={!calibrated} onClick={onContinue}>
                Continue
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
