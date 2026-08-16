import { useCallback, useEffect, useRef } from 'react';

const feedbackSources = {
  correct: `${import.meta.env.BASE_URL}audio/correct-magic-marimba.mp3`,
  wrong: `${import.meta.env.BASE_URL}audio/wrong-gentle-low-tone.mp3`,
};

export function useFeedback(sound: boolean, speech: boolean) {
  const audioRef = useRef<Record<'correct' | 'wrong', HTMLAudioElement> | null>(null);
  const soundRef = useRef(sound);

  soundRef.current = sound;

  useEffect(() => {
    const correct = new Audio(feedbackSources.correct);
    const wrong = new Audio(feedbackSources.wrong);
    correct.preload = 'auto';
    wrong.preload = 'auto';
    audioRef.current = { correct, wrong };

    return () => {
      for (const audio of [correct, wrong]) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      audioRef.current = null;
    };
  }, []);

  const primeFeedback = useCallback(() => {
    if (!soundRef.current) return;
    for (const audio of Object.values(audioRef.current ?? {})) {
      audio.volume = 0;
      void audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => undefined);
    }
  }, []);

  const tone = useCallback(
    (correct: boolean) => {
      if (!sound) return;
      const audio = audioRef.current?.[correct ? 'correct' : 'wrong'];
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      audio.volume = correct ? 0.72 : 0.62;
      void audio.play().catch(() => undefined);
    },
    [sound],
  );

  const speak = useCallback(
    (text: string) => {
      if (!sound || !speech || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.82;
      window.speechSynthesis.speak(utterance);
    },
    [sound, speech],
  );

  return { tone, speak, primeFeedback };
}
