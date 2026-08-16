import { useCallback, useEffect, useRef } from 'react';

const AMBIENCE_VOLUME = 0.08;
const DUCKED_VOLUME = 0.025;

export function useBackgroundAmbience(
  source: string | undefined,
  enabled: boolean,
  active: boolean,
  ducked: boolean,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef(source);
  const enabledRef = useRef(enabled);
  const activeRef = useRef(active);

  sourceRef.current = source;
  enabledRef.current = enabled;
  activeRef.current = active;

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
    const startingVolume = audio.volume;
    const targetVolume = ducked ? DUCKED_VOLUME : AMBIENCE_VOLUME;

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
    const fadeVolume = (now: number) => {
      const progress = Math.min(1, (now - fadeStartedAt) / 250);
      audio.volume = startingVolume + (targetVolume - startingVolume) * progress;
      if (progress < 1) frame = requestAnimationFrame(fadeVolume);
    };

    document.addEventListener('pointerdown', tryPlay);
    document.addEventListener('touchstart', tryPlay);
    document.addEventListener('keydown', tryPlay);
    tryPlay();
    frame = requestAnimationFrame(fadeVolume);

    return () => {
      removeUnlockListeners();
      cancelAnimationFrame(frame);
    };
  }, [active, ducked, enabled, source]);

  const prepareAudio = useCallback(() => {
    const audio = audioRef.current;
    const currentSource = sourceRef.current;
    if (!audio || !currentSource || !enabledRef.current) return null;
    if (audio.getAttribute('src') !== currentSource) {
      audio.src = currentSource;
      audio.load();
    }
    return audio;
  }, []);

  const primeAmbience = useCallback(() => {
    const audio = prepareAudio();
    if (!audio) return;
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        if (!activeRef.current) {
          audio.pause();
          audio.currentTime = 0;
        }
      })
      .catch(() => undefined);
  }, [prepareAudio]);

  const startAmbience = useCallback(() => {
    const audio = prepareAudio();
    if (!audio) return;
    audio.volume = AMBIENCE_VOLUME;
    void audio.play().catch(() => undefined);
  }, [prepareAudio]);

  return { primeAmbience, startAmbience };
}
