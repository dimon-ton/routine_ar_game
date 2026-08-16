import { useCallback, useEffect, useRef } from 'react';

const AMBIENCE_VOLUME = 0.28;

export function useBackgroundAmbience(
  source: string | undefined,
  enabled: boolean,
  active: boolean,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef(source);
  const enabledRef = useRef(enabled);

  sourceRef.current = source;
  enabledRef.current = enabled;

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (source && audio.getAttribute('src') !== source) {
      audio.src = source;
      audio.load();
    }
    if (!source || !enabled || !active) {
      audio.pause();
      return;
    }

    let frame = 0;
    const fadeStartedAt = performance.now();

    const removeUnlockListeners = () => {
      document.removeEventListener('pointerdown', tryPlay);
      document.removeEventListener('touchstart', tryPlay);
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
    document.addEventListener('touchstart', tryPlay);
    document.addEventListener('keydown', tryPlay);
    tryPlay();
    frame = requestAnimationFrame(fadeIn);

    return () => {
      removeUnlockListeners();
      cancelAnimationFrame(frame);
      audio.pause();
    };
  }, [active, enabled, source]);

  return useCallback(() => {
    const audio = audioRef.current;
    const currentSource = sourceRef.current;
    if (!audio || !currentSource || !enabledRef.current) return;
    if (audio.getAttribute('src') !== currentSource) {
      audio.src = currentSource;
      audio.load();
    }
    audio.volume = AMBIENCE_VOLUME;
    void audio.play().catch(() => undefined);
  }, []);
}
