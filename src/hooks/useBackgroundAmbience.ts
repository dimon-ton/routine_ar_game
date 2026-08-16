import { useEffect } from 'react';

const AMBIENCE_VOLUME = 0.12;

export function useBackgroundAmbience(source: string | undefined, enabled: boolean) {
  useEffect(() => {
    if (!source || !enabled) return;

    const audio = new Audio(source);
    let frame = 0;
    const fadeStartedAt = performance.now();

    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;

    const removeUnlockListeners = () => {
      document.removeEventListener('pointerdown', tryPlay);
      document.removeEventListener('keydown', tryPlay);
    };
    const tryPlay = () => {
      void audio
        .play()
        .then(removeUnlockListeners)
        .catch(() => undefined);
    };
    const fadeIn = (now: number) => {
      audio.volume = AMBIENCE_VOLUME * Math.min(1, (now - fadeStartedAt) / 600);
      if (audio.volume < AMBIENCE_VOLUME) frame = requestAnimationFrame(fadeIn);
    };

    document.addEventListener('pointerdown', tryPlay);
    document.addEventListener('keydown', tryPlay);
    tryPlay();
    frame = requestAnimationFrame(fadeIn);

    return () => {
      removeUnlockListeners();
      cancelAnimationFrame(frame);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [enabled, source]);
}
